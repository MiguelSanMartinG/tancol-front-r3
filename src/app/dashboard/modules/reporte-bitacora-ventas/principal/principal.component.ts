import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { AppPrimengModule } from '@shared/app-primeng/app-primeng.module';
import { AppSharedModule } from '@shared/app-shared.module';
import { BotonRegresarComponent } from '@shared/components/boton-regresar/boton-regresar.component';
import { HeaderComponent } from '@shared/components/header/header.component';
import { ExcelExportService, ExportColumn } from '@shared/services/excel.export.service';
import { DateUtilService } from '@shared/services/date-util.service';
import { EmpleadoApiService } from '../../empleados/services/empleado.api.service';
import { getEmpleadoNombreCompleto } from '../../empleados/services/dtos/empleado.response';
import { NuestrosProductosService } from '../../nuestros-productos/service/nuestros-productos.service';
import { RutasApiService } from '../../rutas/services/rutas-api.service';
import { VehiculosApiService } from '../../vehiculos/services/vehiculos-api.service';
import { ReporteBitacoraVentasItem, ReporteBitacoraVentasRequest, ReporteBitacoraVentasService } from '../services/reporte-bitacora-ventas.service';

interface Option { label: string; value: string; }

@Component({
  selector: 'app-reporte-bitacora-ventas', standalone: true,
  imports: [CommonModule, ReactiveFormsModule, AppPrimengModule, AppSharedModule, BotonRegresarComponent, HeaderComponent],
  templateUrl: './principal.component.html',
})
export class PrincipalComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly api = inject(ReporteBitacoraVentasService);
  private readonly fb = inject(FormBuilder);
  private readonly dateUtil = inject(DateUtilService);
  private readonly empleadosApi = inject(EmpleadoApiService);
  private readonly rutasApi = inject(RutasApiService);
  private readonly vehiculosApi = inject(VehiculosApiService);
  private readonly productosApi = inject(NuestrosProductosService);

  readonly filtro = this.fb.group({
    fechaInicio: [new Date()], fechaFin: [new Date()], folio: [''], fechaFirma: [''], estadoVentaRuta: ['FIRMADO'],
    rutas: [[] as string[]], procesos: [[] as string[]], choferes: [[] as string[]],
    ayudantes: [[] as string[]], productos: [[] as string[]], vehiculos: [[] as string[]],
    rotos: [false], rotoPorMaquina: [false], fueraEspecificacion: [false],
  });
  registros: ReporteBitacoraVentasItem[] = [];
  cargando = false;
  readonly opcionesEstatus: Option[] = [
    { label: 'Todos', value: 'TODOS' },
    { label: 'Firmado', value: 'FIRMADO' },
    { label: 'Pendiente', value: 'PENDIENTE' },
  ];
  opciones = { rutas: [] as Option[], procesos: [] as Option[], empleados: [] as Option[], productos: [] as Option[], vehiculos: [] as Option[] };
  readonly columnas: ExportColumn[] = [
    { header: 'Folio', key: 'folio', width: 16 }, { header: 'Ruta', key: 'ruta', width: 20 },
    { header: 'Proceso', key: 'proceso', width: 18 }, { header: 'Chofer', key: 'chofer', width: 24 },
    { header: 'Ayudante', key: 'ayudante', width: 24 }, { header: 'Producto', key: 'producto', width: 24 },
    { header: 'Vehículo', key: 'vehiculo', width: 20 }, { header: 'Fecha firma', key: 'fechaFirma', width: 20 },
    { header: 'Cantidad llegada', key: 'cantidadLlegada', width: 18 }, { header: 'Cantidad salida', key: 'cantidadSalida', width: 18 },
    { header: 'Cantidad vendida', key: 'cantidadVendida', width: 18 },
    { header: 'Rotos', key: 'rotos', width: 12 }, { header: 'Fuera de especificación', key: 'fueraEspecificacion', width: 22 },
    { header: 'Tiempo en bahía', key: 'tiempoBahia', width: 18 },
  ];

  ngOnInit(): void {
    this.rutasApi.getAllFilter('?enabled=true').subscribe((rows) => this.opciones.rutas = rows.map((r) => ({ label: r.nombre, value: r.id })));
    this.vehiculosApi.getAllFilter('?enabled=true').subscribe((rows) => this.opciones.vehiculos = rows.map((v) => ({ label: v.nombre, value: v.id })));
    this.productosApi.getAllFilter('?enabled=true').subscribe((rows) => this.opciones.productos = rows.map((p) => ({ label: p.nombre ?? p.alias, value: p.idProductoComercial })));
    this.empleadosApi.getAllFilter('?enabled=true').subscribe((rows) => this.opciones.empleados = rows.map((e) => ({ label: getEmpleadoNombreCompleto(e) || e.email, value: e.idEmpleado })));
    this.opciones.procesos = [
      { label: 'Manual1', value: 'MANUAL_1' },
      { label: 'Manual2', value: 'MANUAL_2' },
      { label: 'Autoservicio', value: 'AUTOSERVICIO' },
      { label: 'Las Torres', value: 'TORRES' },
      { label: 'Automático', value: 'AUTOMATICO' },
      { label: 'Sin Proceso', value: 'SIN_PROCESO' },
    ];
    this.buscar();
  }

  buscar(): void {
    const value = this.filtro.getRawValue();
    const body: ReporteBitacoraVentasRequest = {
      fechaInicio: value.fechaInicio ? this.dateUtil.toUTCStartOfDay(new Date(value.fechaInicio)) : undefined,
      fechaFin: value.fechaFin ? this.dateUtil.toUTCEndOfDay(new Date(value.fechaFin)) : undefined,
      folio: value.folio?.trim() || undefined, fechaFirma: value.fechaFirma || undefined, estadoVentaRuta: value.estadoVentaRuta === 'TODOS' ? undefined : (value.estadoVentaRuta || undefined),
      rutas: value.rutas ?? [], procesos: value.procesos ?? [], choferes: value.choferes ?? [], ayudantes: value.ayudantes ?? [], productos: value.productos ?? [], vehiculos: value.vehiculos ?? [],
      rotos: value.rotos ?? false,
      rotoPorMaquina: value.rotoPorMaquina ?? false,
      fueraEspecificacion: value.fueraEspecificacion ?? false,
    };
    this.cargando = true;
    this.api.getReport(body).subscribe({ next: (response) => { const data = Array.isArray(response) ? response : response.data ?? response.items ?? []; const estatus = value.estadoVentaRuta || 'FIRMADO'; this.registros = data.filter((row) => estatus === 'TODOS' || row['estadoVentaRuta'] === estatus).map((row) => ({ ...row, ayudante: this.value(row, 'ayudante', 'nombreAyudante', 'ayudantes'), tiempoBahia: this.tiempoBahia(row) })); }, error: () => { this.registros = []; this.cargando = false; }, complete: () => this.cargando = false });
  }

  limpiar(): void { this.filtro.reset({ fechaInicio: new Date(), fechaFin: new Date(), folio: '', fechaFirma: '', estadoVentaRuta: 'FIRMADO', rutas: [], procesos: [], choferes: [], ayudantes: [], productos: [], vehiculos: [], rotos: false, rotoPorMaquina: false, fueraEspecificacion: false }); this.buscar(); }
  exportar(): void { if (this.registros.length) ExcelExportService.exportAsExcelFile(this.registros.map((r) => ({ ...r, tiempoBahia: this.tiempoBahia(r) })), this.columnas, 'reporte-bitacora-ventas'); }
  abrirDetalle(row: ReporteBitacoraVentasItem): void {
    if (row.idBitacora) this.router.navigate(['/dashboard/principal/bitacora-ventas/actualizar', row.idBitacora]);
  }
  total(key: string): number { return this.registros.reduce((sum, row) => sum + Number(row[key] ?? 0), 0); }
  value(row: ReporteBitacoraVentasItem, ...keys: string[]): string { return keys.map((key) => row[key]).find((value) => value !== null && value !== undefined && value !== '')?.toString() ?? '-'; }
  fechaFirma(row: ReporteBitacoraVentasItem): string { const date = this.date(row, 'fechaFirma'); return date ? date.toLocaleString('es-MX') : '-'; }
  tiempoBahia(row: ReporteBitacoraVentasItem): string { const llegada = this.date(row, 'horaLlegada', 'fechaLlegada', 'horaLlegadaBahia'); const firma = this.date(row, 'fechaFirma', 'horaFirma'); if (!llegada || !firma || firma < llegada) return '-'; const minutes = Math.floor((firma.getTime() - llegada.getTime()) / 60000); return `${Math.floor(minutes / 60)}h ${minutes % 60}m`; }
  private date(row: ReporteBitacoraVentasItem, ...keys: string[]): Date | null { const value = keys.map((key) => row[key]).find(Boolean); const date = value ? new Date(String(value)) : null; return date && !isNaN(date.getTime()) ? date : null; }
}
