import { CommonModule } from '@angular/common';
import { Component, inject, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { AppPrimengModule } from '@shared/app-primeng/app-primeng.module';
import { HeaderComponent } from '@shared/components/header/header.component';
import { BotonRegresarComponent } from '@shared/components/boton-regresar/boton-regresar.component';
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
import { BitacoraVentaListItem, VentaRutaApiService } from '../services/venta-ruta.api.service';

@Component({
  selector: 'app-venta-ruta-principal',
  standalone: true,
  imports: [
    CommonModule,
    BotonRegresarComponent,
    HeaderComponent,
    AppPrimengModule,
    DatetimePipe,
    ReactiveFormsModule,
    ...NATIVE_TABLE_IMPORTS,
  ],
  templateUrl: './principal.component.html',
  styleUrl: './principal.component.scss'
})
export class PrincipalComponent implements OnInit, OnDestroy {
  ventaRutaService = inject(VentaRutaApiService);
  @ViewChild(NativeTableComponent)
  set nativeTable(table: NativeTableComponent | undefined) {
    this.page.table = table;
  }

  constructor(private router: Router, private route: ActivatedRoute) {}

  // Locale para calendarios en español
  esLocale = {
    firstDayOfWeek: 1,
    dayNames: ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'],
    dayNamesShort: ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'],
    dayNamesMin: ['D', 'L', 'M', 'X', 'J', 'V', 'S'],
    monthNames: [
      'enero',
      'febrero',
      'marzo',
      'abril',
      'mayo',
      'junio',
      'julio',
      'agosto',
      'septiembre',
      'octubre',
      'noviembre',
      'diciembre',
    ],
    monthNamesShort: ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'],
    today: 'Hoy',
    clear: 'Limpiar',
  };

  filtroFechas = new FormGroup({
    fechaInicio: new FormControl<Date | null>(null),
    fechaFin: new FormControl<Date | null>(null),
  });

  readonly columns: NativeColumn<any>[] = [
    { id: 'folio', label: 'Folio', field: 'folio', width: 160, filter: { type: 'text' }, align: 'left' },
    { id: 'fecha', label: 'Fecha', width: 150, filter: { type: 'date' }, align: 'left' },
    { id: 'partidas', label: 'Partidas', width: 120, filter: { type: 'number' }, align: 'left' },
    { id: 'createdAt', label: 'Creado', width: 180, filter: { type: 'date' }, align: 'left' },
    { id: 'updatedAt', label: 'Modificado', width: 180, filter: { type: 'date' }, align: 'left' },
    { id: 'acciones', label: 'Acciones', width: 110, minWidth: 96, sortable: false, tooltip: false, align: 'center' },
  ];

  /** Paginación, filtros y orden en el servidor (GET bitacoras-rutas/page). */
  readonly page = new CatalogTableState<BitacoraVentaListItem>(
    (query) => this.ventaRutaService.getPage(this.conFiltroFechas(query)),
  );

  ngOnInit() {
    const today = new Date();
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0);
    const endOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999);

    this.filtroFechas.patchValue({
      fechaInicio: startOfToday,
      fechaFin: endOfToday,
    });

    this.page.resetAndLoad();
  }

  ngOnDestroy(): void {
    this.page.destroy();
  }

  /**
   * Agrega al query el rango del bloque superior. Igual que antes, filtra por la fecha de creación
   * (filter_createdAt=desde..hasta) y se intersecta con el filtro de la columna "Creado" si lo hay.
   * El orden por defecto (createdAt DESC) lo aplica el servidor.
   */
  private conFiltroFechas(query: CatalogPageQuery): CatalogPageQuery {
    const filters: NativeFilters = { ...query.filters };
    const inicio = this.filtroFechas.value.fechaInicio ?? null;
    const fin = this.filtroFechas.value.fechaFin ?? null;
    const superior = formatRange(inicio ? ymd(inicio) : '', fin ? ymd(fin) : '');
    const columna = typeof filters['createdAt'] === 'string' ? (filters['createdAt'] as string) : null;
    const rango = intersectarRangos(columna, superior);
    if (rango) filters['createdAt'] = rango;
    else delete filters['createdAt'];
    return { ...query, filters };
  }

  displayCreate() {
    this.router.navigate(['../crear'], { relativeTo: this.route });
  }

  displayUpdate(itemDto: any) {
    this.router.navigate(['../actualizar', itemDto.idBitacora], {
      relativeTo: this.route
    });
  }

  primerAyudante(item: any): string {
    const partida = item?.bitacoraPartidaVentas?.[0];
    const ayudante = partida?.comisionesEmpleados?.find((c: any) => c.empleado?.idEmpleado !== partida?.conductor?.idEmpleado);
    return ayudante?.empleado?.nombre ?? '-';
  }

  filtrarPorFechas() {
    this.page.resetAndLoad();
  }

  limpiarFiltros() {
    this.filtroFechas.reset({
      fechaInicio: null,
      fechaFin: null,
    });
    this.page.clearQuery();
  }
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
