import { Component, ElementRef, HostListener, computed, inject, input, model, signal } from '@angular/core';

export interface DiaCalendario {
  fecha: Date;
  /** Fuera del mes mostrado: celda vacía. */
  vacio: boolean;
}

/** Inicio de la semana laboral: viernes (5). La semana va de viernes a jueves. */
export const DIA_INICIO_SEMANA = 5;

/** Semana de viernes a jueves que contiene `ref` (desplazada `offset` semanas). */
export function semanaViernes(ref = new Date(), offset = 0): { inicio: Date; fin: Date } {
  const base = new Date(ref.getFullYear(), ref.getMonth(), ref.getDate());
  const atras = (base.getDay() - DIA_INICIO_SEMANA + 7) % 7;
  const inicio = new Date(base.getFullYear(), base.getMonth(), base.getDate() - atras + offset * 7);
  const fin = new Date(inicio.getFullYear(), inicio.getMonth(), inicio.getDate() + 6, 23, 59, 59, 999);
  return { inicio, fin };
}

const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
const DIAS = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

function soloDia(d: Date): number {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

/**
 * Selector de rango de fechas estilo Airbnb: dos campos (inicio y fin) que abren un calendario
 * de dos meses; los días entre inicio y fin se van marcando, incluso al pasar el cursor.
 */
@Component({
  selector: 'app-date-range',
  templateUrl: './date-range.component.html',
  styleUrl: './date-range.component.scss',
})
export class DateRangeComponent {
  private readonly host = inject(ElementRef<HTMLElement>);

  readonly inicio = model<Date | null>(null);
  readonly fin = model<Date | null>(null);
  readonly labelInicio = input('Fecha inicio');
  readonly labelFin = input('Fecha fin');

  readonly abierto = signal(false);
  readonly hover = signal<Date | null>(null);
  /** Primer mes visible del calendario. */
  readonly mesBase = signal(new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  readonly diasSemana = DIAS;

  readonly meses = computed(() => {
    const b = this.mesBase();
    return [0, 1].map((n) => {
      const primero = new Date(b.getFullYear(), b.getMonth() + n, 1);
      const vacios = (primero.getDay() + 6) % 7; // semana que inicia en lunes
      const total = new Date(primero.getFullYear(), primero.getMonth() + 1, 0).getDate();
      const dias: DiaCalendario[] = [];
      for (let i = 0; i < vacios; i++) dias.push({ fecha: new Date(primero), vacio: true });
      for (let d = 1; d <= total; d++) dias.push({ fecha: new Date(primero.getFullYear(), primero.getMonth(), d), vacio: false });
      return { titulo: `${MESES[primero.getMonth()]} ${primero.getFullYear()}`, dias };
    });
  });

  private readonly hoy = soloDia(new Date());

  /** Extremo final efectivo: el elegido, o el que se previsualiza con el cursor. */
  private readonly finVisible = computed(() => {
    const ini = this.inicio();
    if (!ini) return null;
    if (this.fin()) return this.fin();
    const h = this.hover();
    return h && soloDia(h) >= soloDia(ini) ? h : null;
  });

  texto(d: Date | null): string {
    return d ? d.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' }) : '';
  }

  abrir() {
    const ref = this.inicio() ?? new Date();
    this.mesBase.set(new Date(ref.getFullYear(), ref.getMonth(), 1));
    this.abierto.set(true);
  }

  cerrar() {
    this.abierto.set(false);
    this.hover.set(null);
  }

  mover(meses: number) {
    const b = this.mesBase();
    this.mesBase.set(new Date(b.getFullYear(), b.getMonth() + meses, 1));
  }

  elegir(dia: DiaCalendario) {
    if (dia.vacio) return;
    const d = dia.fecha;
    const ini = this.inicio();
    if (!ini || this.fin() || soloDia(d) < soloDia(ini)) {
      this.inicio.set(new Date(d.getFullYear(), d.getMonth(), d.getDate()));
      this.fin.set(null);
      return;
    }
    this.fin.set(new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999));
    this.cerrar();
  }

  semana(offset: number) {
    const { inicio, fin } = semanaViernes(new Date(), offset);
    this.inicio.set(inicio);
    this.fin.set(fin);
    this.cerrar();
  }

  limpiar() {
    this.inicio.set(null);
    this.fin.set(null);
  }

  hayFin() {
    return !!this.finVisible();
  }

  esInicio(d: DiaCalendario) {
    const i = this.inicio();
    return !d.vacio && !!i && soloDia(d.fecha) === soloDia(i);
  }

  esFin(d: DiaCalendario) {
    const f = this.finVisible();
    return !d.vacio && !!f && soloDia(d.fecha) === soloDia(f);
  }

  enRango(d: DiaCalendario) {
    const i = this.inicio();
    const f = this.finVisible();
    if (d.vacio || !i || !f) return false;
    const t = soloDia(d.fecha);
    return t > soloDia(i) && t < soloDia(f);
  }

  esHoy(d: DiaCalendario) {
    return !d.vacio && soloDia(d.fecha) === this.hoy;
  }

  @HostListener('document:mousedown', ['$event'])
  alClicFuera(event: MouseEvent) {
    if (this.abierto() && !this.host.nativeElement.contains(event.target as Node)) this.cerrar();
  }

  @HostListener('keydown.escape')
  alEscape() {
    this.cerrar();
  }
}
