import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { AppPrimengModule } from '@shared/app-primeng/app-primeng.module';
import { HeaderComponent } from '@shared/components/header/header.component';
import { BotonRegresarComponent } from '@shared/components/boton-regresar/boton-regresar.component';
import { VentaRutaApiService } from '../services/venta-ruta.api.service';
import { DatetimePipe } from '@shared/pipes/datetime.pipe';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { VentaRutaResponse } from '../services/venta-ruta.response';

@Component({
  selector: 'app-venta-ruta-principal',
  standalone: true,
  imports: [CommonModule, BotonRegresarComponent, HeaderComponent, AppPrimengModule, DatetimePipe, ReactiveFormsModule],
  templateUrl: './principal.component.html',
  styleUrl: './principal.component.scss'
})
export class PrincipalComponent {
  ventaRutaService = inject(VentaRutaApiService);
  listaRegistrosFiltrados: VentaRutaResponse[] = [];

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
  busquedaGlobal = '';

  ngOnInit() {
    const today = new Date();
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0);
    const endOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999);

    this.filtroFechas.patchValue({
      fechaInicio: startOfToday,
      fechaFin: endOfToday,
    });

    this.ventaRutaService.getAll().subscribe(() => {
      this.aplicarFiltros();
    });
  }

  private aplicarFiltros() {
    const data = this.ventaRutaService.listAll();
    if (!Array.isArray(data) || data.length === 0) {
      this.listaRegistrosFiltrados = [];
      return;
    }

    const inicio = this.filtroFechas.value.fechaInicio ?? null;
    const fin = this.filtroFechas.value.fechaFin ?? null;

    const term = this.busquedaGlobal.trim().toLowerCase();

    const sorted = [...data].sort((a, b) => {
      const da = this.normalizeToDate(a?.createdAt) ?? this.normalizeToDate(a?.fecha);
      const db = this.normalizeToDate(b?.createdAt) ?? this.normalizeToDate(b?.fecha);
      if (!da && !db) return 0;
      if (!da) return 1;
      if (!db) return -1;
      return db.getTime() - da.getTime();
    });

    this.listaRegistrosFiltrados = sorted
      .filter((item) => {
        // Filtra usando la fecha de creación mostrada en la tabla
        const d = this.normalizeToDate(item?.createdAt);
        if (!d) return false;
        return this.isBetweenLocalDay(d, inicio, fin);
      })
      .filter((item) => (term ? this.matchesBusquedaGlobal(item, term) : true));
  }

  displayCreate() {
    this.router.navigate(['../crear'], { relativeTo: this.route });
  }

  displayUpdate(itemDto: any) {
    this.router.navigate(['../actualizar', itemDto.idBitacora], {
      relativeTo: this.route
    });
  }
  displayDelete(itemDto: any) {
    // this.eliminarComponent.itemDto.set({
    //   ...itemDto
    // });
    // this.eliminarComponent.display = true;
  }

  primerAyudante(item: any): string {
    const partida = item?.bitacoraPartidaVentas?.[0];
    const ayudante = partida?.comisionesEmpleados?.find((c: any) => c.empleado?.idEmpleado !== partida?.conductor?.idEmpleado);
    return ayudante?.empleado?.nombre ?? '-';
  }

  filtrarPorFechas() {
    this.aplicarFiltros();
  }

  limpiarFiltros(input?: HTMLInputElement) {
    this.filtroFechas.reset({
      fechaInicio: null,
      fechaFin: null,
    });
    this.busquedaGlobal = '';
    if (input) input.value = '';
    this.aplicarFiltros();
  }

  searchTable(event: Event) {
    const value = (event.target as HTMLInputElement | null)?.value ?? '';
    this.busquedaGlobal = value;
    this.aplicarFiltros();
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

  private matchesBusquedaGlobal(item: any, term: string): boolean {
    const vals = [
      item.folio,
      item.status,
      item.bitacoraPartidaVentas?.length,
      this.normalizeToDate(item.fecha),
      this.normalizeToDate(item.createdAt),
      this.normalizeToDate(item.updatedAt),
      item.usuario?.nombre,
    ];
    return vals.some((v) => this.normalizeSearchValue(v).includes(term));
  }

  private normalizeSearchValue(value: unknown): string {
    if (value === null || value === undefined) return '';
    if (value instanceof Date) return value.toLocaleString('es-MX').toLowerCase();
    return value.toString().toLowerCase();
  }
}
