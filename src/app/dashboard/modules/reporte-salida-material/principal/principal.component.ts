import { Component, DoCheck, OnInit, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AppPrimengModule } from '@shared/app-primeng/app-primeng.module';
import { BotonRegresarComponent } from '@shared/components/boton-regresar/boton-regresar.component';
import { HeaderComponent } from '@shared/components/header/header.component';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { AppSharedModule } from '@shared/app-shared.module';
import { ExcelExportService, ExportColumn } from '@shared/services/excel.export.service';
import { ReporteSalidaMaterialService, SalidaMaterialResponse, SalidaMaterial } from '../services/reporte-salida-material.service';
import { EmpleadoApiService } from '../../empleados/services/empleado.api.service';
import { getEmpleadoNombreCompleto } from '../../empleados/services/dtos/empleado.response';
import { AlmacenApiService } from '../../almacen/services/almacen.api.service';
import { ProductoApiService } from '../../producto/services/producto.api.service';
import { SelectModel } from '@core/common/select.model';
import { DateUtilService } from '@shared/services/date-util.service';

@Component({
  selector: 'app-reporte-salida-material',
  standalone: true,
  imports: [
    CommonModule,
    BotonRegresarComponent,
    HeaderComponent,
    AppPrimengModule,
    ReactiveFormsModule,
    AppSharedModule,
  ],
  templateUrl: './principal.component.html',
  styleUrl: './principal.component.scss',
})
export class PrincipalComponent implements OnInit, DoCheck {
  reporteApi = inject(ReporteSalidaMaterialService);
  empleadoApi = inject(EmpleadoApiService);
  almacenApi = inject(AlmacenApiService);
  productoApi = inject(ProductoApiService);
  fb = inject(FormBuilder);
  dateUtil = inject(DateUtilService);
  filtro!: FormGroup;
  listaRegistros!: SalidaMaterialResponse;
  listaAreas: SelectModel[] = [];
  listaEmpleados: SelectModel[] = [];
  listaAlmacenes: SelectModel[] = [];
  listaInsumos: SelectModel[] = [];
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
  configurationExport: {
    columns: ExportColumn[];
    titleDownload: string;
  } = {
    columns: [
      { header: 'Folio', key: 'folio', width: 15 },
      { header: 'Fecha', key: 'fecha', width: 22 },
      { header: 'Área', key: 'area', width: 24 },
      { header: 'Estado', key: 'estado', width: 18 },
      { header: 'Entrega', key: 'empleadoEntrega', width: 25 },
      { header: 'Recibe', key: 'empleadoRecibe', width: 25 },
      { header: 'Almacén', key: 'almacen', width: 30 },
      { header: 'Insumo', key: 'insumo', width: 35 },
      { header: 'Alias', key: 'alias', width: 18 },
      { header: 'Unidad de medida', key: 'unidadMedida', width: 20 },
      { header: 'Cantidad', key: 'cantidad', width: 12 },
      { header: 'Comentario de partida', key: 'comentarioPartida', width: 35 },
      { header: 'Comentario de la orden', key: 'comentarioOrden', width: 35 },
    ],
    titleDownload: 'reporte-salida-material',
  };

  constructor() {
    this.filtro = this.fb.group({
      fechaInicio: [''],
      fechaFin: [''],
      areas: [[]],
      idEmpleados: [[]],
      almacenes: [[]],
      insumos: [[]],
      limite: [null],
    });

    this.empleadoApi.getAllFilter('?enabled=true').subscribe((resp) => {
      const mapped = resp.map((e) => ({
        label: getEmpleadoNombreCompleto(e),
        value: e.idEmpleado,
      }));
      this.listaEmpleados = mapped;
    });

    this.almacenApi.getAllFilter('?enabled=true').subscribe((resp) => {
      this.listaAlmacenes = resp.map((a) => ({ label: a.nombre, value: a.id }));
    });

    this.productoApi.getAllFilter('?enabled=true').subscribe((resp) => {
      this.listaInsumos = resp.map((p) => ({ label: p.nombre, value: p.idProducto }));
    });
  }

  ngOnInit(): void {
    this.buscar();
  }

  ngDoCheck(): void {
    const nextSignature = JSON.stringify({
      empleados: this.filtro?.get('idEmpleados')?.value ?? [],
    });

    if (nextSignature !== this.selectedEmployeesSignature) {
      this.selectedEmployeesSignature = nextSignature;
      this.loadMissingSelectedEmployees();
    }
  }

  getEmpleadoOptions(): SelectModel[] {
    const selectedIds = new Set<string>(
      (this.filtro?.get('idEmpleados')?.value ?? []).map((id: string) => String(id))
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
    const selectedIds = [
      ...((this.filtro?.get('idEmpleados')?.value ?? []) as string[]),
    ].map((id) => String(id));

    const knownIds = new Set([
      ...this.listaEmpleados.map((item) => item.value),
      ...this.missingEmployeeOptions.keys(),
    ]);

    for (const id of selectedIds) {
      if (!id || knownIds.has(id)) {
        continue;
      }

      knownIds.add(id);
      this.empleadoApi.getOne(id).subscribe((empleado) => {
        this.missingEmployeeOptions.set(empleado.idEmpleado, {
          label: `${getEmpleadoNombreCompleto(empleado)} (desactivado)`,
          value: empleado.idEmpleado,
          disabled: false,
        });
      });
    }
  }

  buscar(): void {
    const filtros = this.filtro.value;
    const fechaInicioUtc = filtros.fechaInicio
      ? this.dateUtil.toUTCStartOfDay(new Date(filtros.fechaInicio))
      : undefined;
    const fechaFinUtc = filtros.fechaFin
      ? this.dateUtil.toUTCEndOfDay(new Date(filtros.fechaFin))
      : undefined;
    this.reporteApi
      .getAll({
        fechaInicio: fechaInicioUtc,
        fechaFin: fechaFinUtc,
        areas: filtros.areas,
        idEmpleados: filtros.idEmpleados,
        idAlmacenes: filtros.almacenes,
        idInsumos: filtros.insumos,
      })
      .subscribe((res) => {
        this.listaRegistros = res;
        this.opcionesLimite[this.opcionesLimite.length - 1].value = res.totalFilas;
        const areasDisponibles = new Set(this.listaAreas.map((area) => area.value));
        for (const fila of res.filas ?? []) {
          if (fila.area && !areasDisponibles.has(fila.area)) {
            this.listaAreas.push({ label: fila.area, value: fila.area });
            areasDisponibles.add(fila.area);
          }
        }
      });
  }

  get filasVisibles(): SalidaMaterial[] {
    const filas = this.listaRegistros?.filas ?? [];
    const limite = this.filtro?.get('limite')?.value;
    return limite ? filas.slice(0, limite) : filas;
  }

  cleanTable() {
    this.table.clear();
    this.filtro.reset({
      fechaInicio: '',
      fechaFin: '',
      areas: [],
      idEmpleados: [],
      almacenes: [],
      insumos: [],
      limite: null,
    });
    this.buscar();
  }

  exportar(): void {
    if (!this.listaRegistros?.filas?.length) return;
    ExcelExportService.exportAsExcelFile(
      this.listaRegistros.filas,
      this.configurationExport.columns,
      this.configurationExport.titleDownload
    );
  }
}
