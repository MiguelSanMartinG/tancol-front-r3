import { Component, inject, ViewChild } from '@angular/core';
import { FormGroup, FormControl, ReactiveFormsModule } from '@angular/forms';
import { CalendarModule } from 'primeng/calendar';
import { AppPrimengModule } from '@shared/app-primeng/app-primeng.module';
import { BotonRegresarComponent } from '@shared/components/boton-regresar/boton-regresar.component';
import { HeaderComponent } from '@shared/components/header/header.component';
import { StatusBinaryReadOnlyComponent } from '@shared/components/status-binary-read-only/status-binary-read-only.component';
import { BadgeEstatusOrdenComponent } from '@shared/components/badge-estatus-orden/badge-estatus-orden.component';
import { DatetimePipe } from '@shared/pipes/datetime.pipe';
import { LiquidacionApiService } from '../services/liquidacion.api.service';
import { LiquidacionResponse } from '../services/dtos/liquidacion.response.dto';
import { CommonModule } from '@angular/common';
import { EliminarComponent } from '../eliminar/eliminar.component';
import { ActivatedRoute, Router } from '@angular/router';
import { EmpleadoApiService } from '../../empleados/services/empleado.api.service';
import { getEmpleadoNombreCompleto } from '../../empleados/services/dtos/empleado.response';

interface FilterOption { label: string; value: string; }

@Component({
  selector: 'app-liquidacion-principal',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    CalendarModule,
    BotonRegresarComponent,
    HeaderComponent,
    AppPrimengModule,
    DatetimePipe,
    StatusBinaryReadOnlyComponent,
    EliminarComponent,
    BadgeEstatusOrdenComponent,
  ],
  templateUrl: './principal.component.html',
  styleUrl: './principal.component.scss',
})
export class PrincipalComponent {
  liquidacionApi = inject(LiquidacionApiService);
  @ViewChild(EliminarComponent) eliminarComponent!: EliminarComponent;
  router = inject(Router);
  route = inject(ActivatedRoute);
  empleadosApi = inject(EmpleadoApiService);

  // Filtros
  filtroFechas = new FormGroup({
    fechaInicio: new FormControl<Date | null>(new Date()),
    fechaFin: new FormControl<Date | null>(new Date()),
  });

  // Donde guardamos resultados filtrados (si hay filtro activo)
  registrosFiltrados: any[] = [];

  // Arreglo ESTABLE para la tabla (ǧsalo en el HTML con [value])
  listaRegistrosView: any[] = [];
  // Texto libre de búsqueda global
  busquedaGlobal = '';
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

  ngOnInit(): void {
    this.empleadosApi.getAllFilter('?enabled=true').subscribe((empleados) => {
      const empleadosActivos = this.buildEmployeeOptions(empleados);
      this.listaChoferes = empleadosActivos;
      this.listaAyudantes = [...empleadosActivos];
    });
    // Carga inicial desde la API
    this.liquidacionApi.getAll().subscribe({
      next: () => this.buildListaVista(), // construye la vista cuando haya datos en memoria
      error: () => this.buildListaVista(),
    });
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

  /** Reconstruye el arreglo estable que consume la tabla. */
  private buildListaVista(): void {
    const base = this.dataSource();
    this.buildFilterOptions(base);

    if (!base.length) {
      this.listaRegistrosView = [];
      return;
    }

    const hasAdvancedFilters = this.hasAdvancedFilters();
    // Si no hay filtros manuales, por defecto mostramos sólo "hoy".
    const showOnlyToday = !this.filtroFechaActivo && !hasAdvancedFilters;
    const hoyStr = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD local

    const rows = base
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
          // Si quieres tener Date para pipes/inputs:
          fecha: d ?? row.fecha,
        };
      });

    const term = this.busquedaGlobal.trim().toLowerCase();
    this.listaRegistrosView = term ? rows.filter((row) => this.matchesBusquedaGlobal(row, term)) : rows;
  }

  // =================
  //  ACCIONES / UI
  // =================

  filtrarPorFechas() {
    this.filtroFechaActivo = Boolean(this.filtroFechas.value.fechaInicio || this.filtroFechas.value.fechaFin);
    this.buildListaVista();
  }

  filtrarTabla(): void { this.buildListaVista(); }

  limpiarFiltros(input?: HTMLInputElement) {
    const hoy = new Date();
    this.filtroFechas.reset({
      fechaInicio: hoy,
      fechaFin: hoy,
    });
    this.filtrosTabla.reset({ rutas: [], choferes: [], ayudantes: [], vehiculos: [], estatus: [] });
    this.busquedaGlobal = '';
    if (input) input.value = '';
    this.filtroFechaActivo = false;
    this.buildListaVista();
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
    console.log('Editar', item);
    this.router.navigate(['../actualizar', item.idLiquidacion], { relativeTo: this.route });
  }

  displayDelete(item: LiquidacionResponse) {
    this.eliminarComponent.itemDto.set({ ...item });
    this.eliminarComponent.display = true;
  }

  displayCreate() {
    this.router.navigate(['../crear'], { relativeTo: this.route });
  }

  searchTable(event: Event) {
    const value = (event.target as HTMLInputElement | null)?.value ?? '';
    this.busquedaGlobal = value;
    this.buildListaVista();
  }

  limpiarBusquedaGlobal(input?: HTMLInputElement) {
    if (input) {
      input.value = '';
    }
    this.busquedaGlobal = '';
    this.buildListaVista();
  }

  deleteAll() {
    // Intencionalmente vacío por ahora
  }

  private matchesBusquedaGlobal(row: any, term: string): boolean {
    const valores = [
      row.folio,
      row.bloqueNota,
      this.getRutaNombre(row),
      this.getChoferNombre(row),
      row.estadosLiquidacion,
      row.idLiquidacion,
      row.totalProductos,
      row.partidas?.length,
      this.getTotalEstimado(row),
      this.normalizeToDate(row?.fecha),
      this.normalizeToDate(row?.createdAt),
      this.normalizeToDate(row?.updatedAt),
    ];
    return valores.some((value) => this.normalizeSearchValue(value).includes(term));
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
    this.listaEstatus = collect(rows.map((row) => ({ id: row?.estadosLiquidacion, label: row?.estadosLiquidacion })));
  }

  private buildEmployeeOptions(empleados: any[]): FilterOption[] {
    return empleados
      .map((empleado) => ({
        value: String(empleado.idEmpleado),
        label: getEmpleadoNombreCompleto(empleado) || empleado.nombreUsuario || empleado.idEmpleado,
      }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }

  private getPersonLabel(row: any, id: string): string {
    const entries = [
      ...(row?.totalizados ?? []).flatMap((total: any) => total?.empleados ?? []),
      ...(row?.partidas ?? []).flatMap((partida: any) => partida?.ayudantes ?? []),
    ];
    const person = entries.find((entry: any) => String(entry?.idEmpleado ?? entry?.id) === id);
    return [person?.nombre, person?.apellidoPaterno, person?.apellidoMaterno].filter(Boolean).join(' ') || person?.nombreUsuario || id;
  }

  private normalizeSearchValue(value: unknown): string {
    if (value === null || value === undefined) return '';
    if (value instanceof Date) {
      return value.toLocaleString('es-MX').toLowerCase();
    }
    return value.toString().toLowerCase();
  }
}






