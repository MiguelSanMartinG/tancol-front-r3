import { CommonModule } from '@angular/common';
import { Component, inject, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { catchError, map, Observable, of } from 'rxjs';
import { AppPrimengModule } from '@shared/app-primeng/app-primeng.module';
import { HeaderComponent } from '@shared/components/header/header.component';
import { BotonRegresarComponent } from '@shared/components/boton-regresar/boton-regresar.component';
import { DatetimePipe } from '@shared/pipes/datetime.pipe';
import {
  CatalogTableState,
  localPageSource,
  NativeColumn,
  NativeTableComponent,
  NATIVE_TABLE_IMPORTS,
} from '@shared/ui/native-table';
import { VentaRutaApiService } from '../services/venta-ruta.api.service';
import { VentaRutaResponse } from '../services/venta-ruta.response';

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
    { id: 'folio', label: 'Folio', field: 'folio', width: 160, filter: { type: 'text' }, align: 'center' },
    { id: 'fecha', label: 'Fecha', width: 150, filter: { type: 'date' }, align: 'center' },
    { id: 'partidas', label: 'Partidas', width: 120, filter: { type: 'number' }, align: 'center' },
    { id: 'createdAt', label: 'Creado', width: 180, filter: { type: 'date' }, align: 'center' },
    { id: 'updatedAt', label: 'Modificado', width: 180, filter: { type: 'date' }, align: 'center' },
    { id: 'acciones', label: 'Acciones', width: 110, minWidth: 96, sortable: false, tooltip: false, align: 'center' },
  ];

  /** true cuando ya se pidió la lista al servidor; ordenar/filtrar/buscar reutiliza lo que hay en memoria. */
  private datosCargados = false;

  private readonly source = localPageSource<any>(() => this.cargarVista(), this.columns, {
    value: (row, key) => {
      switch (key) {
        case 'partidas': return row?.bitacoraPartidaVentas?.length ?? 0;
        case 'usuario': return row?.usuario?.nombre;
        default: return row?.[key];
      }
    },
    searchKeys: ['folio', 'status', 'partidas', 'fecha', 'createdAt', 'updatedAt', 'usuario'],
  });
  readonly page = new CatalogTableState<any>(this.source.request);

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

  /** Lista para la tabla: pide al servidor la primera vez y aplica el rango de fechas del bloque superior. */
  private cargarVista(): Observable<VentaRutaResponse[]> {
    const base$ = this.datosCargados
      ? of(this.ventaRutaService.listAll())
      : this.ventaRutaService.getAll().pipe(
          map(() => {
            this.datosCargados = true;
            return this.ventaRutaService.listAll();
          }),
          catchError(() => of(this.ventaRutaService.listAll())),
        );
    return base$.pipe(map((data) => this.aplicarFiltros(data)));
  }

  private aplicarFiltros(data: VentaRutaResponse[]): VentaRutaResponse[] {
    if (!Array.isArray(data) || data.length === 0) return [];

    const inicio = this.filtroFechas.value.fechaInicio ?? null;
    const fin = this.filtroFechas.value.fechaFin ?? null;

    const sorted = [...data].sort((a, b) => {
      const da = this.normalizeToDate(a?.createdAt) ?? this.normalizeToDate(a?.fecha);
      const db = this.normalizeToDate(b?.createdAt) ?? this.normalizeToDate(b?.fecha);
      if (!da && !db) return 0;
      if (!da) return 1;
      if (!db) return -1;
      return db.getTime() - da.getTime();
    });

    return sorted.filter((item) => {
      // Filtra usando la fecha de creación mostrada en la tabla
      const d = this.normalizeToDate(item?.createdAt);
      if (!d) return false;
      return this.isBetweenLocalDay(d, inicio, fin);
    });
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
    this.source.invalidate();
    this.page.resetAndLoad();
  }

  limpiarFiltros() {
    this.filtroFechas.reset({
      fechaInicio: null,
      fechaFin: null,
    });
    this.source.invalidate();
    this.page.clearQuery();
  }

  private normalizeToDate(v: unknown): Date | null {
    if (!v) return null;
    try {
      const d = new Date(v as any);
      return isNaN(d.getTime()) ? null : d;
    } catch {
      return null;
    }
  }

  private isBetweenLocalDay(d: Date, ini: Date | null, fin: Date | null): boolean {
    if (!ini && !fin) return true;
    const start = ini ? new Date(ini) : null;
    const end = fin ? new Date(fin) : null;
    if (start) {
      start.setHours(0, 0, 0, 0);
      if (d < start) return false;
    }
    if (end) {
      end.setHours(23, 59, 59, 999);
      if (d > end) return false;
    }
    return true;
  }
}
