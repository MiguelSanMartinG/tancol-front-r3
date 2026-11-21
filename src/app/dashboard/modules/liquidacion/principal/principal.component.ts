import { Component, inject, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormGroup, FormControl, ReactiveFormsModule } from '@angular/forms';
import { CalendarModule } from 'primeng/calendar';
import { TagModule } from 'primeng/tag';
import { AppPrimengModule } from '@shared/app-primeng/app-primeng.module';
import { BotonRegresarComponent } from '@shared/components/boton-regresar/boton-regresar.component';
import { HeaderComponent } from '@shared/components/header/header.component';
import { DatetimePipe } from '@shared/pipes/datetime.pipe';
import {
  CatalogPageQuery,
  CatalogTableState,
  formatRange,
  NativeColumn,
  NativeFilters,
  NativeTableComponent,
  NATIVE_TABLE_IMPORTS,
  parseRange,
} from '@shared/ui/native-table';
import { LiquidacionApiService } from '../services/liquidacion.api.service';
import { LiquidacionListItem } from '../services/dtos/liquidacion.response.dto';
import { CommonModule } from '@angular/common';
import { EliminarComponent } from '../eliminar/eliminar.component';
import { ActivatedRoute, Router } from '@angular/router';
import { EmpleadoApiService } from '../../empleados/services/empleado.api.service';
import { getEmpleadoNombreCompleto } from '../../empleados/services/dtos/empleado.response';
import { RutasApiService } from '../../rutas/services/rutas-api.service';
import { VehiculosApiService } from '../../vehiculos/services/vehiculos-api.service';

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

/** Estatus que existen en el back (enum EstadosLiquidacion). */
const ESTATUS_LIQUIDACION: FilterOption[] = [
  { value: 'BORRADOR', label: 'Borrador' },
  { value: 'PENDIENTE', label: 'Pendiente' },
  { value: 'FINALIZADA', label: 'Finalizada' },
  { value: 'CANCELADA', label: 'Cancelada' },
];

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

/** Date local → 'YYYY-MM-DD' (formato que espera el back en los rangos de fecha). */
function ymd(date: Date): string {
  return date.toLocaleDateString('en-CA');
}

/** Intersección de dos rangos 'desde..hasta' (YYYY-MM-DD se compara como texto). */
function intersectarRangos(a: string | null, b: string | null): string | null {
  if (!a) return b;
  if (!b) return a;
  const ra = parseRange(a);
  const rb = parseRange(b);
  const desde = [ra.from, rb.from].filter(Boolean).sort().pop() ?? '';
  const hasta = [ra.to, rb.to].filter(Boolean).sort().shift() ?? '';
  return formatRange(desde, hasta);
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
  rutasApi = inject(RutasApiService);
  vehiculosApi = inject(VehiculosApiService);

  // Filtros
  filtroFechas = new FormGroup({
    fechaInicio: new FormControl<Date | null>(new Date()),
    fechaFin: new FormControl<Date | null>(new Date()),
  });

  /** false al entrar: sin filtros del bloque superior se muestra solo el día de hoy. */
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
  listaEstatus: FilterOption[] = [...ESTATUS_LIQUIDACION];

  readonly columns: NativeColumn<any>[] = [
    { id: 'folio', label: 'Folio', field: 'folio', width: 130, filter: { type: 'text' }, align: 'left' },
    { id: 'fecha', label: 'Fecha', width: 170, filter: { type: 'date' }, align: 'left' },
    { id: 'ruta', label: 'Ruta', width: 160, filter: { type: 'text' }, align: 'left' },
    { id: 'chofer', label: 'Chofer', width: 220, filter: { type: 'text' }, align: 'left' },
    { id: 'bloqueNota', label: 'Bloque nota', field: 'bloqueNota', width: 130, filter: { type: 'text' }, align: 'left' },
    { id: 'partidas', label: 'Partidas', width: 110, filter: { type: 'number' }, align: 'left' },
    { id: 'totalEstimado', label: 'Total estimado', width: 150, filter: { type: 'number' }, align: 'left' },
    { id: 'createdAt', label: 'Creado', width: 170, filter: { type: 'date' }, align: 'left' },
    { id: 'estatus', label: 'Estatus', width: 140, align: 'left' },
    { id: 'updatedAt', label: 'Modificado', width: 170, filter: { type: 'date' }, align: 'left' },
    { id: 'acciones', label: 'Acción', width: 100, minWidth: 90, sortable: false, tooltip: false, align: 'center' },
  ];

  /** Paginación, filtros y orden en el servidor (GET liquidacion/page). */
  readonly page = new CatalogTableState<LiquidacionListItem>(
    (query) => this.liquidacionApi.getPage(this.conFiltrosSuperiores(query)),
  );

  ngOnInit(): void {
    this.empleadosApi.getAllFilter('?enabled=true').subscribe((empleados) => {
      const empleadosActivos = this.buildEmployeeOptions(empleados);
      this.listaChoferes = empleadosActivos;
      this.listaAyudantes = [...empleadosActivos];
    });
    this.rutasApi.getAllFilter().subscribe((rutas) => {
      this.listaRutas = this.ordenar(
        (rutas ?? []).map((ruta: any) => ({
          value: String(ruta.id),
          label: String(ruta.nombre || ruta.numero || ruta.id),
        })),
      );
    });
    this.vehiculosApi.getAllFilter().subscribe((vehiculos) => {
      this.listaVehiculos = this.ordenar(
        (vehiculos ?? []).map((vehiculo: any) => ({
          value: String(vehiculo.id),
          label: vehiculo.placas ? `${vehiculo.nombre} (${vehiculo.placas})` : String(vehiculo.nombre || vehiculo.id),
        })),
      );
    });
    this.page.resetAndLoad();
  }

  ngOnDestroy(): void {
    this.page.destroy();
  }

  // ======================
  //  FILTROS → SERVIDOR
  // ======================

  /**
   * Agrega al query de la tabla los filtros del bloque superior.
   * Los selects viajan como listas de ids (filter_rutaIds=uuid1,uuid2 …) para no chocar con el filtro de
   * texto de las columnas Ruta / Chofer. El rango de fechas se intersecta con el filtro de la columna Fecha.
   */
  private conFiltrosSuperiores(query: CatalogPageQuery): CatalogPageQuery {
    const filters: NativeFilters = { ...query.filters };
    const seleccion = this.filtrosTabla.getRawValue();
    const lista = (key: string, values: string[] | null | undefined) => {
      if (values?.length) filters[key] = values.join(',');
    };
    lista('rutaIds', seleccion.rutas);
    lista('choferIds', seleccion.choferes);
    lista('ayudanteIds', seleccion.ayudantes);
    lista('vehiculoIds', seleccion.vehiculos);
    lista('estatus', seleccion.estatus);

    const columnaFecha = typeof filters['fecha'] === 'string' ? (filters['fecha'] as string) : null;
    const fecha = intersectarRangos(columnaFecha, this.rangoFechaSuperior());
    if (fecha) filters['fecha'] = fecha;
    else delete filters['fecha'];

    return { ...query, filters };
  }

  /** Rango de fechas del bloque superior; por defecto (sin filtros aplicados) solo hoy. */
  private rangoFechaSuperior(): string | null {
    if (!this.filtroFechaActivo) {
      if (this.hasAdvancedFilters()) return null;
      const hoy = ymd(new Date());
      return `${hoy}..${hoy}`;
    }
    const inicio = this.filtroFechas.value.fechaInicio ?? null;
    const fin = this.filtroFechas.value.fechaFin ?? null;
    return formatRange(inicio ? ymd(inicio) : '', fin ? ymd(fin) : '');
  }

  private hasAdvancedFilters(): boolean {
    return Object.values(this.filtrosTabla.getRawValue()).some((values) => (values ?? []).length > 0);
  }

  // =================
  //  ACCIONES / UI
  // =================

  filtrarPorFechas() {
    this.filtroFechaActivo = Boolean(this.filtroFechas.value.fechaInicio || this.filtroFechas.value.fechaFin);
    this.page.resetAndLoad();
  }

  filtrarTabla(): void { this.page.resetAndLoad(); }

  limpiarFiltros() {
    const hoy = new Date();
    this.filtroFechas.reset({
      fechaInicio: hoy,
      fechaFin: hoy,
    });
    this.filtrosTabla.reset({ rutas: [], choferes: [], ayudantes: [], vehiculos: [], estatus: [] });
    this.filtroFechaActivo = false;
    this.page.clearQuery();
  }

  estatusLabel(value: unknown): string {
    return etiquetaEstatus(value);
  }

  estatusSeverity(value: unknown): Severidad {
    return ESTATUS[claveEstatus(value)]?.severity ?? 'secondary';
  }

  /** Total estimado (suma precio * cantidad de las partidas), calculado en el servidor. */
  getTotalEstimado(item: LiquidacionListItem): number {
    return Number(item?.totalEstimado ?? 0);
  }

  getRutaNombre(item: LiquidacionListItem): string {
    return item?.ruta?.nombre ?? item?.ruta?.numero ?? '-';
  }

  getChoferNombre(item: LiquidacionListItem): string {
    const chofer = item?.chofer;
    if (!chofer) return '-';
    return [chofer.nombre, chofer.apellidoPaterno, chofer.apellidoMaterno]
      .filter(Boolean)
      .join(' ')
      .trim() || chofer.nombreUsuario || '-';
  }

  displayUpdate(item: LiquidacionListItem) {
    this.router.navigate(['../actualizar', item.idLiquidacion], { relativeTo: this.route });
  }

  displayDelete(item: LiquidacionListItem) {
    this.eliminarComponent.itemDto.set({ ...(item as any) });
    this.eliminarComponent.display = true;
  }

  displayCreate() {
    this.router.navigate(['../crear'], { relativeTo: this.route });
  }

  deleteAll() {
    // Intencionalmente vacío por ahora
  }

  private ordenar(options: FilterOption[]): FilterOption[] {
    return options.sort((a, b) => a.label.localeCompare(b.label, 'es', { numeric: true, sensitivity: 'base' }));
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
