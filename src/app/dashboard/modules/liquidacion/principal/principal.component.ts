import { Component, inject, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormGroup, FormControl, ReactiveFormsModule } from '@angular/forms';
import { CalendarModule } from 'primeng/calendar';
import { TagModule } from 'primeng/tag';
import { catchError, map, Observable, of } from 'rxjs';
import { AppPrimengModule } from '@shared/app-primeng/app-primeng.module';
import { BotonRegresarComponent } from '@shared/components/boton-regresar/boton-regresar.component';
import { HeaderComponent } from '@shared/components/header/header.component';
import { DatetimePipe } from '@shared/pipes/datetime.pipe';
import {
  CatalogTableState,
  localPageSource,
  NativeColumn,
  NativeTableComponent,
  NATIVE_TABLE_IMPORTS,
} from '@shared/ui/native-table';
import { LiquidacionApiService } from '../services/liquidacion.api.service';
import { LiquidacionResponse } from '../services/dtos/liquidacion.response.dto';
import { CommonModule } from '@angular/common';
import { EliminarComponent } from '../eliminar/eliminar.component';
import { ActivatedRoute, Router } from '@angular/router';
import { EmpleadoApiService } from '../../empleados/services/empleado.api.service';
import { getEmpleadoNombreCompleto } from '../../empleados/services/dtos/empleado.response';

interface FilterOption { label: string; value: string; }

type Severidad = 'success' | 'secondary' | 'info' | 'warn' | 'danger' | 'contrast';

/** Estatus de liquidación → etiqueta legible y color del chip. */
const ESTATUS: Record<string, { label: string; severity: Severidad }> = {
  BORRADOR: { label: 'Borrador', severity: 'warn' },
  PENDIENTE: { label: 'Pendiente', severity: 'info' },
  'POR AUTORIZAR': { label: 'Por autorizar', severity: 'warn' },
  AUTORIZAR: { label: 'Por autorizar', severity: 'warn' },
  AUTORIZADO: { label: 'Autorizado', severity: 'success' },
  AUTORIZADA: { label: 'Autorizada', severity: 'success' },
  COMPLETADA: { label: 'Completada', severity: 'success' },
  FINALIZADA: { label: 'Finalizada', severity: 'success' },
  FINALIZADO: { label: 'Finalizado', severity: 'success' },
  CERRADA: { label: 'Cerrada', severity: 'secondary' },
  CERRADO: { label: 'Cerrado', severity: 'secondary' },
  CANCELADA: { label: 'Cancelada', severity: 'danger' },
  CANCELADO: { label: 'Cancelado', severity: 'danger' },
};

function claveEstatus(value: unknown): string {
  return String(value ?? '').trim().toUpperCase().replace(/_/g, ' ');
}

function etiquetaEstatus(value: unknown): string {
  const clave = claveEstatus(value);
  if (!clave) return '';
  const conocido = ESTATUS[clave];
  if (conocido) return conocido.label;
  return clave.charAt(0) + clave.slice(1).toLowerCase();
}

@Component({
  selector: 'app-liquidacion-principal',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    CalendarModule,
    TagModule,
    BotonRegresarComponent,
    HeaderComponent,
    AppPrimengModule,
    DatetimePipe,
    EliminarComponent,
    ...NATIVE_TABLE_IMPORTS,
  ],
  templateUrl: './principal.component.html',
  styleUrl: './principal.component.scss',
})
export class PrincipalComponent implements OnInit, OnDestroy {
  liquidacionApi = inject(LiquidacionApiService);
  @ViewChild(EliminarComponent) eliminarComponent!: EliminarComponent;
  @ViewChild(NativeTableComponent)
  set nativeTable(table: NativeTableComponent | undefined) {
    this.page.table = table;
  }
  router = inject(Router);
  route = inject(ActivatedRoute);
  empleadosApi = inject(EmpleadoApiService);

  // Filtros
  filtroFechas = new FormGroup({
    fechaInicio: new FormControl<Date | null>(new Date()),
    fechaFin: new FormControl<Date | null>(new Date()),
  });

  filtroFechaActivo = false;
  filtrosTabla = new FormGroup({
    rutas: new FormControl<string[]>([]),
    choferes: new FormControl<string[]>([]),
    ayudantes: new FormControl<string[]>([]),
    vehiculos: new FormControl<string[]>([]),
    estatus: new FormControl<string[]>([]),
  });
  listaRutas: FilterOption[] = [];
  listaChoferes: FilterOption[] = [];
  listaAyudantes: FilterOption[] = [];
  listaVehiculos: FilterOption[] = [];
  listaEstatus: FilterOption[] = [];

  readonly columns: NativeColumn<any>[] = [
    { id: 'folio', label: 'Folio', field: 'folio', width: 130, filter: { type: 'text' }, align: 'center' },
    { id: 'fecha', label: 'Fecha', width: 170, filter: { type: 'date' }, align: 'center' },
    { id: 'ruta', label: 'Ruta', width: 160, filter: { type: 'text' }, align: 'center' },
    { id: 'chofer', label: 'Chofer', width: 220, filter: { type: 'text' }, align: 'center' },
    { id: 'bloqueNota', label: 'Bloque nota', field: 'bloqueNota', width: 130, filter: { type: 'text' }, align: 'center' },
    { id: 'partidas', label: 'Partidas', width: 110, filter: { type: 'number' }, align: 'center' },
    { id: 'totalEstimado', label: 'Total estimado', width: 150, filter: { type: 'number' }, align: 'center' },
    { id: 'createdAt', label: 'Creado', width: 170, filter: { type: 'date' }, align: 'center' },
    { id: 'estatus', label: 'Estatus', width: 140, align: 'center' },
    { id: 'updatedAt', label: 'Modificado', width: 170, filter: { type: 'date' }, align: 'center' },
    { id: 'acciones', label: 'Acción', width: 100, minWidth: 90, sortable: false, tooltip: false, align: 'center' },
  ];

  /** true cuando ya se pidió la lista al servidor; ordenar/filtrar/buscar reutiliza lo que hay en memoria. */
  private datosCargados = false;

  private readonly source = localPageSource<any>(() => this.cargarVista(), this.columns, {
    value: (row, key) => {
      switch (key) {
        case 'ruta': return this.getRutaNombre(row);
        case 'chofer': return this.getChoferNombre(row);
        case 'partidas': return row?.partidas?.length ?? 0;
        case 'totalEstimado': return this.getTotalEstimado(row);
        case 'estatus': return row?.estadosLiquidacion;
        case 'estatusLabel': return etiquetaEstatus(row?.estadosLiquidacion);
        case 'fechaTexto': return row?.fecha instanceof Date ? row.fecha.toLocaleString('es-MX') : row?.fecha;
        default: return row?.[key];
      }
    },
    searchKeys: ['folio', 'bloqueNota', 'ruta', 'chofer', 'estatusLabel', 'idLiquidacion', 'partidas', 'totalEstimado', 'fechaTexto'],
  });
  readonly page = new CatalogTableState<any>(this.source.request);

  ngOnInit(): void {
    this.empleadosApi.getAllFilter('?enabled=true').subscribe((empleados) => {
      const empleadosActivos = this.buildEmployeeOptions(empleados);
      this.listaChoferes = empleadosActivos;
      this.listaAyudantes = [...empleadosActivos];
    });
    // Carga inicial desde la API (la hace la tabla en su primera página)
    this.page.resetAndLoad();
  }

  ngOnDestroy(): void {
    this.page.destroy();
  }

  // ============
  //  UTILIDADES
  // ============

  /** Normaliza cualquier fecha (Date | string ISO con/sin Z) a Date válido. */
  private normalizeToDate(v: unknown): Date | null {
    if (!v) return null;
    try {
      if (typeof v === 'string') {
        // Si no trae Z ni offset, asumimos UTC y agregamos 'Z'
        const iso = /Z$|[+-]\d{2}:\d{2}$/.test(v) ? v : v + 'Z';
        const d = new Date(iso);
        return isNaN(d.getTime()) ? null : d;
      }
      const d = new Date(v as any);
      return isNaN(d.getTime()) ? null : d;
    } catch {
      return null;
    }
  }

  /** Obtiene todos los registros en memoria (lista sin filtrar). */
  private dataSource(): any[] {
    const data = this.liquidacionApi.listAll() ?? [];
    return Array.isArray(data) ? data : [];
  }

  /** Devuelve true si `d` está entre [ini..fin] en hora local (fin incluye fin de día). */
  private isBetweenLocalDay(d: Date, ini: Date | null, fin: Date | null): boolean {
    if (!ini && !fin) return true;
    const start = ini ? new Date(ini) : null;
    const end = fin ? new Date(fin) : null;

    if (start) {
      // normalizamos inicio al comienzo del día local
      start.setHours(0, 0, 0, 0);
      if (d < start) return false;
    }
    if (end) {
      // normalizamos fin al final del día local
      end.setHours(23, 59, 59, 999);
      if (d > end) return false;
    }
    return true;
  }

  // ======================
  //  CONSTRUCCIÓN DE VISTA
  // ======================

  /** Lista para la tabla: pide al servidor la primera vez y aplica los filtros del bloque superior. */
  private cargarVista(): Observable<any[]> {
    const base$ = this.datosCargados
      ? of(this.dataSource())
      : this.liquidacionApi.getAll().pipe(
          map(() => {
            this.datosCargados = true;
            return this.dataSource();
          }),
          catchError(() => of(this.dataSource())),
        );
    return base$.pipe(map((base) => this.buildListaVista(base)));
  }

  /** Aplica fechas y filtros avanzados (ruta, chofer, ayudante, vehículo, estatus). */
  private buildListaVista(base: any[]): any[] {
    this.buildFilterOptions(base);

    if (!base.length) return [];

    const hasAdvancedFilters = this.hasAdvancedFilters();
    // Si no hay filtros manuales, por defecto mostramos sólo "hoy".
    const showOnlyToday = !this.filtroFechaActivo && !hasAdvancedFilters;
    const hoyStr = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD local

    return base
      .filter((row: any) => {
        const d = this.normalizeToDate(row?.fecha);
        if (!d) return false;

        if (showOnlyToday) {
          const fechaLocalStr = d.toLocaleDateString('en-CA'); // YYYY-MM-DD local
          return fechaLocalStr === hoyStr;
        }
        if (this.filtroFechaActivo) {
          const inicio = this.filtroFechas.value.fechaInicio ?? null;
          const fin = this.filtroFechas.value.fechaFin ?? null;
          if (!this.isBetweenLocalDay(d, inicio, fin)) return false;
        }
        return this.matchesTableFilters(row);
      })
      .map((row: any) => {
        const d = this.normalizeToDate(row?.fecha);
        return {
          ...row,
          // clave estable para la tabla
          idLiquidacion: row.idLiquidacion ?? row.id ?? row.folio,
          updatedAt: row.updatedAt || row.createdAt,
          totalProductos: 0,
          fecha: d ?? row.fecha,
        };
      });
  }

  private recargarTabla(): void {
    this.source.invalidate();
    this.page.resetAndLoad();
  }

  // =================
  //  ACCIONES / UI
  // =================

  filtrarPorFechas() {
    this.filtroFechaActivo = Boolean(this.filtroFechas.value.fechaInicio || this.filtroFechas.value.fechaFin);
    this.recargarTabla();
  }

  filtrarTabla(): void { this.recargarTabla(); }

  limpiarFiltros() {
    const hoy = new Date();
    this.filtroFechas.reset({
      fechaInicio: hoy,
      fechaFin: hoy,
    });
    this.filtrosTabla.reset({ rutas: [], choferes: [], ayudantes: [], vehiculos: [], estatus: [] });
    this.filtroFechaActivo = false;
    this.source.invalidate();
    this.page.clearQuery();
  }

  estatusLabel(value: unknown): string {
    return etiquetaEstatus(value);
  }

  estatusSeverity(value: unknown): Severidad {
    return ESTATUS[claveEstatus(value)]?.severity ?? 'secondary';
  }

  /**
   * Calcula el total estimado de las partidas (precio * cantidad)
   */
  getTotalEstimado(item: any): number {
    if (!item.partidas || !Array.isArray(item.partidas)) return 0;
    return item.partidas.reduce((acc: number, p: any) => acc + (p.precio * p.cantidad), 0);
  }

  getRutaNombre(item: any): string {
    return item?.ruta?.nombre ?? item?.ruta?.numero ?? '-';
  }

  getChoferNombre(item: any): string {
    const chofer = item?.ruta?.choferBase;
    if (!chofer) return '-';
    return [chofer.nombre, chofer.apellidoPaterno, chofer.apellidoMaterno]
      .filter(Boolean)
      .join(' ')
      .trim() || chofer.nombreUsuario || '-';
  }

  displayUpdate(item: LiquidacionResponse) {
    this.router.navigate(['../actualizar', item.idLiquidacion], { relativeTo: this.route });
  }

  displayDelete(item: LiquidacionResponse) {
    this.eliminarComponent.itemDto.set({ ...item });
    this.eliminarComponent.display = true;
  }

  displayCreate() {
    this.router.navigate(['../crear'], { relativeTo: this.route });
  }

  deleteAll() {
    // Intencionalmente vacío por ahora
  }

  private hasAdvancedFilters(): boolean {
    return Object.values(this.filtrosTabla.getRawValue()).some((values) => (values ?? []).length > 0);
  }

  private matchesTableFilters(row: any): boolean {
    const filters = this.filtrosTabla.getRawValue();
    return this.matchesSelected(filters.rutas, this.getRouteIds(row))
      && this.matchesSelected(filters.choferes, this.getChoferIds(row))
      && this.matchesSelected(filters.ayudantes, this.getHelperIds(row))
      && this.matchesSelected(filters.vehiculos, this.getVehicleIds(row))
      && this.matchesSelected(filters.estatus, [String(row?.estadosLiquidacion ?? '')]);
  }

  private matchesSelected(selected: string[] | null | undefined, available: string[]): boolean {
    if (!selected?.length) return true;
    return selected.some((value) => available.includes(String(value)));
  }

  private getRouteIds(row: any): string[] {
    return [row?.ruta?.id, row?.idRuta].filter(Boolean).map(String);
  }

  private getChoferIds(row: any): string[] {
    return [row?.ruta?.choferBase?.idEmpleado, row?.idChofer, row?.chofer?.idEmpleado].filter(Boolean).map(String);
  }

  private getVehicleIds(row: any): string[] {
    return [row?.ruta?.vehiculosBase?.id, row?.vehiculo?.id, row?.idVehiculo].filter(Boolean).map(String);
  }

  private getHelperIds(row: any): string[] {
    const entries = [
      ...(row?.totalizados ?? []).flatMap((total: any) => total?.empleados ?? []),
      ...(row?.partidas ?? []).flatMap((partida: any) => [
        ...(partida?.ayudantes ?? []),
        ...(partida?.ayudantesAsignados ?? []),
        ...(partida?.comisionesEmpleados ?? []).map((commission: any) => commission?.empleado ?? commission),
        ...(partida?.choferes ?? []).flatMap((chofer: any) => chofer?.ayudantes ?? []),
      ]),
    ];
    const choferIds = new Set(this.getChoferIds(row));
    return entries
      .map((entry: any) => entry?.idEmpleado ?? entry?.id ?? entry?.empleado?.idEmpleado)
      .filter((id: any) => id && !choferIds.has(String(id)))
      .map(String);
  }

  private buildFilterOptions(rows: any[]): void {
    const collect = (items: Array<{ id: any; label: any }>): FilterOption[] => {
      const map = new Map<string, string>();
      items.filter((item) => item.id).forEach((item) => map.set(String(item.id), String(item.label || item.id)));
      return [...map.entries()].map(([value, label]) => ({ value, label })).sort((a, b) => a.label.localeCompare(b.label));
    };
    this.listaRutas = collect(rows.map((row) => ({ id: row?.ruta?.id ?? row?.idRuta, label: this.getRutaNombre(row) })));
    this.listaRutas.sort((a, b) => a.label.localeCompare(b.label, 'es', { numeric: true, sensitivity: 'base' }));
    this.listaVehiculos = collect(rows.map((row) => ({ id: row?.ruta?.vehiculosBase?.id ?? row?.idVehiculo, label: row?.ruta?.vehiculosBase?.nombre ?? row?.vehiculo?.nombre ?? row?.idVehiculo })));
    this.listaEstatus = collect(rows.map((row) => ({ id: row?.estadosLiquidacion, label: etiquetaEstatus(row?.estadosLiquidacion) })));
  }

  private buildEmployeeOptions(empleados: any[]): FilterOption[] {
    return empleados
      .map((empleado) => ({
        value: String(empleado.idEmpleado),
        label: getEmpleadoNombreCompleto(empleado) || empleado.nombreUsuario || empleado.idEmpleado,
      }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }
}
