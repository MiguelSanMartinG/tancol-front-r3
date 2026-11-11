import { Component, DoCheck, OnInit, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { BotonRegresarComponent } from '@shared/components/boton-regresar/boton-regresar.component';
import { HeaderComponent } from '@shared/components/header/header.component';
import { AppPrimengModule } from '@shared/app-primeng/app-primeng.module';
import { AppSharedModule } from '@shared/app-shared.module';
import {
  ReporteVolumenVentasEmpleadoDiaService,
  VolumenVentasEmpleadoDiaItem,
  VolumenVentasEmpleadoDiaRequest,
} from '../services/reporte-volumen-ventas-empleado-dia.service';
import { EmpleadoApiService } from '../../empleados/services/empleado.api.service';
import { getEmpleadoNombreCompleto } from '../../empleados/services/dtos/empleado.response';
import { NuestrosProductosService } from '../../nuestros-productos/service/nuestros-productos.service';
import { SelectModel } from '@core/common/select.model';
import { ExcelExportService, ExportColumn } from '@shared/services/excel.export.service';
import { DateUtilService } from '@shared/services/date-util.service';
import { RutasApiService } from '../../rutas/services/rutas-api.service';
import { ConceptoVentaApiService } from '../../concepto-venta/services/concepto-venta.api.service';

@Component({
  selector: 'app-reporte-volumen-ventas-empleado-dia',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, AppPrimengModule, BotonRegresarComponent, HeaderComponent, AppSharedModule],
  templateUrl: './principal.component.html',
  styleUrl: './principal.component.scss',
})
export class PrincipalComponent implements OnInit, DoCheck {
  fb = inject(FormBuilder);
  reporteApi = inject(ReporteVolumenVentasEmpleadoDiaService);
  empleadosApi = inject(EmpleadoApiService);
  productosApi = inject(NuestrosProductosService);
  rutasApi = inject(RutasApiService);
  conceptosVentaApi = inject(ConceptoVentaApiService);
  dateUtil = inject(DateUtilService);

  filtro!: FormGroup;
  listaRegistros: VolumenVentasEmpleadoDiaItem[] = [];
  listaEmpleados: SelectModel[] = [];
  listaProductos: SelectModel[] = [];
  listaRutas: SelectModel[] = [];
  listaConceptosVenta: SelectModel[] = [];
  private empleadosMap = new Map<string, string>();
  private missingEmployeeOptions = new Map<string, SelectModel>();
  private selectedEmployeesSignature = '';
  opcionesLimite = [
    { label: '10', value: 10 },
    { label: '25', value: 25 },
    { label: '50', value: 50 },
    { label: '100', value: 100 },
    { label: 'Todos', value: null },
  ];
  @ViewChild('table') table!: any;

  constructor() {
    this.filtro = this.fb.group({
      fechaInicio: [new Date(), Validators.required],
      fechaFin: [new Date(), Validators.required],
      empleados: [[]],
      productos: [[]],
      rutas: [[]],
      conceptosVenta: [[]],
      facturado: [false],
      limite: [null],
    });
  }

  ngOnInit(): void {
    this.empleadosApi.getAllFilter('?enabled=true').subscribe((resp) => {
      this.empleadosMap = new Map(
        resp.map((empleado) => [empleado.idEmpleado, getEmpleadoNombreCompleto(empleado)])
      );
      this.listaEmpleados = resp.map((e) => ({
        label: getEmpleadoNombreCompleto(e),
        value: e.idEmpleado,
      }));
      if (this.listaRegistros.length > 0) {
        this.listaRegistros = this.listaRegistros.map((item) => ({
          ...item,
          nombre: this.empleadosMap.get(String(item.idEmpleado)) ?? item.nombre,
        }));
      }
    });
    this.productosApi.getAllFilter('?enabled=true').subscribe((resp) => {
      this.listaProductos = resp.map((p) => ({ label: p.alias, value: p.idProductoComercial }));
    });
    this.rutasApi.getAllFilter('?enabled=true').subscribe((resp) => {
      this.listaRutas = resp.map((ruta) => ({ label: ruta.nombre, value: ruta.id }));
    });
    this.conceptosVentaApi.getAllFilter('?enabled=true').subscribe((resp) => {
      this.listaConceptosVenta = resp.map((concepto) => ({
        label: concepto.name || concepto.concepto,
        value: concepto.id,
      }));
    });
    this.buscar();
  }

  ngDoCheck(): void {
    const nextSignature = JSON.stringify(this.filtro?.get('empleados')?.value ?? []);
    if (nextSignature !== this.selectedEmployeesSignature) {
      this.selectedEmployeesSignature = nextSignature;
      this.loadMissingSelectedEmployees();
    }
  }

  getEmpleadoOptions(): SelectModel[] {
    const selectedIds = new Set<string>(
      (this.filtro?.get('empleados')?.value ?? []).map((id: string) => String(id))
    );
    const options = [...this.listaEmpleados];

    for (const [id, option] of this.missingEmployeeOptions.entries()) {
      if (selectedIds.has(id)) {
        options.push({ ...option, disabled: false });
      }
    }

    return options.sort((a, b) => a.label.localeCompare(b.label));
  }

  private loadMissingSelectedEmployees(): void {
    const selectedIds = ((this.filtro?.get('empleados')?.value ?? []) as string[]).map((id) => String(id));
    const knownIds = new Set([
      ...this.listaEmpleados.map((item) => item.value),
      ...this.missingEmployeeOptions.keys(),
    ]);

    for (const id of selectedIds) {
      if (!id || knownIds.has(id)) {
        continue;
      }

      knownIds.add(id);
      this.empleadosApi.getOne(id).subscribe((empleado) => {
        this.missingEmployeeOptions.set(empleado.idEmpleado, {
          label: `${getEmpleadoNombreCompleto(empleado)} (desactivado)`,
          value: empleado.idEmpleado,
          disabled: false,
        });
      });
    }
  }

  buscar(): void {
    if (this.filtro.invalid) {
      this.filtro.markAllAsTouched();
      return;
    }
    const filtros = this.filtro.value;
    const body: VolumenVentasEmpleadoDiaRequest = {
      fechaInicio: this.dateUtil.toUTCStartOfDay(new Date(filtros.fechaInicio)),
      fechaFin: this.dateUtil.toUTCEndOfDay(new Date(filtros.fechaFin)),
      idEmpledos: filtros.empleados || [],
      idProductos: filtros.productos || [],
      idRutas: filtros.rutas || [],
      idConceptosVenta: filtros.conceptosVenta || [],
      facturado: filtros.facturado ?? false,
    };
    this.reporteApi.getReporte(body).subscribe((res) => {
      this.listaRegistros = (res ?? []).map((item) => ({
        ...item,
        nombre: this.empleadosMap.get(String(item.idEmpleado)) ?? item.nombre,
      }));
      const total = this.listaRegistros.length;
      this.opcionesLimite[this.opcionesLimite.length - 1].value = total;
      this.table?.reset();
    });
  }

  cleanTable(): void {
    this.table?.clear();
    this.filtro.reset({
      fechaInicio: new Date(),
      fechaFin: new Date(),
      empleados: [],
      productos: [],
      rutas: [],
      conceptosVenta: [],
      facturado: false,
      limite: null,
    });
    this.listaRegistros = [];
    this.buscar();
  }

  limiteActual(): number | null {
    const v = this.filtro.get('limite')?.value;
    if (v === null || v === undefined) return null;
    return Number(v);
  }

  formatMoney(value: number | string | null | undefined): string {
    const amount = Number(value ?? 0);
    if (!Number.isFinite(amount)) return '$ 0.00';

    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  }

  exportar(): void {
    if (!this.listaRegistros.length) return;
    const columns: ExportColumn[] = [
      { header: 'Fecha', key: 'fecha', width: 18 },
      { header: 'Empleado', key: 'nombre', width: 30 },
      { header: 'Ruta', key: 'nombreRuta', width: 20 },
      { header: 'Concepto de venta', key: 'conceptoVenta', width: 25 },
      { header: 'Producto', key: 'producto', width: 20 },
      { header: 'Cantidad vendida', key: 'cantidadVendida', width: 18 },
      { header: 'Facturado', key: 'facturados', width: 14 },
    ];
    ExcelExportService.exportAsExcelFile(this.listaRegistros, columns, 'reporte-empleado-por-dia');
  }
}
