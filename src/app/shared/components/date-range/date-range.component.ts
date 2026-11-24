import { Component, ElementRef, HostListener, computed, inject, input, model, signal } from '@angular/core';

export interface DiaCalendario {
  fecha: Date;
  /** Fuera del mes mostrado: celda vacía. */
  vacio: boolean;
  /** Posterior a la fecha máxima (hoy, en consultas): no se puede elegir. */
  bloqueado?: boolean;
}

/** Inicio de la semana laboral: viernes (5). La semana va de viernes a jueves. */
export const DIA_INICIO_SEMANA = 5;

/**
 * Semana de viernes a jueves que contiene `ref` (desplazada `offset` semanas).
 * Como son consultas, el fin nunca pasa de hoy: la semana en curso va del viernes a hoy.
 */
export function semanaViernes(ref = new Date(), offset = 0): { inicio: Date; fin: Date } {
  const base = new Date(ref.getFullYear(), ref.getMonth(), ref.getDate());
  const atras = (base.getDay() - DIA_INICIO_SEMANA + 7) % 7;
  const inicio = new Date(base.getFullYear(), base.getMonth(), base.getDate() - atras + offset * 7);
  const finSemana = new Date(inicio.getFullYear(), inicio.getMonth(), inicio.getDate() + 6, 23, 59, 59, 999);
  const hoy = new Date();
  const finHoy = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate(), 23, 59, 59, 999);
  return { inicio, fin: finSemana > finHoy ? finHoy : finSemana };
}

const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
const DIAS = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

function soloDia(d: Date): number {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

function inicioDia(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function finDia(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);
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

  private readonly hoy = soloDia(new Date());

  readonly inicio = model<Date | null>(null);
  readonly fin = model<Date | null>(null);
  readonly labelInicio = input('Fecha inicio');
  readonly labelFin = input('Fecha fin');
  /** Permite elegir fechas posteriores a hoy. En consultas queda en false: solo hoy y hacia atrás. */
  readonly allowFuture = input(false);

  readonly abierto = signal(false);
  /** Extremo que se está eligiendo: lo define el campo en que se hizo clic. */
  readonly editando = signal<'inicio' | 'fin'>('inicio');
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
      for (let d = 1; d <= total; d++) {
        const fecha = new Date(primero.getFullYear(), primero.getMonth(), d);
        dias.push({ fecha, vacio: false, bloqueado: !this.allowFuture() && soloDia(fecha) > this.hoy });
      }
      return { titulo: `${MESES[primero.getMonth()]} ${primero.getFullYear()}`, dias };
    });
  });

  /**
   * Rango que se pinta: el elegido, o el que se previsualiza con el cursor sobre el extremo que se edita.
   * Siempre ordenado (a ≤ b): si el fin queda antes del inicio, se invierten.
   */
  private readonly rangoVisible = computed<{ a: Date | null; b: Date | null }>(() => {
    const ini = this.inicio();
    const fin = this.fin();
    const h = this.abierto() ? this.hover() : null;
    let x = ini;
    let y = fin;
    if (h && this.editando() === 'fin' && ini) y = h;
    else if (h && this.editando() === 'inicio' && fin) x = h;
    if (!x || !y) return { a: x ?? y, b: null };
    return soloDia(x) <= soloDia(y) ? { a: x, b: y } : { a: y, b: x };
  });

  texto(d: Date | null): string {
    return d ? d.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' }) : '';
  }

  /** En consultas el mes actual va a la derecha y el anterior a la izquierda. */
  readonly puedeAvanzar = computed(() => {
    if (this.allowFuture()) return true;
    const b = this.mesBase();
    const hoy = new Date();
    return new Date(b.getFullYear(), b.getMonth() + 1, 1) < new Date(hoy.getFullYear(), hoy.getMonth(), 1);
  });

  abrir(campo: 'inicio' | 'fin' = 'inicio') {
    // Sin fecha de inicio, el primer clic siempre la define.
    this.editando.set(campo === 'fin' && this.inicio() ? 'fin' : 'inicio');
    const ref = (campo === 'fin' ? this.fin() ?? this.inicio() : this.inicio() ?? this.fin()) ?? new Date();
    // El mes de la fecha final (u hoy) queda a la derecha, para navegar hacia atrás.
    this.mesBase.set(this.allowFuture() ? new Date(ref.getFullYear(), ref.getMonth(), 1) : new Date(ref.getFullYear(), ref.getMonth() - 1, 1));
    this.abierto.set(true);
  }

  cerrar() {
    this.abierto.set(false);
    this.hover.set(null);
  }

  mover(meses: number) {
    if (meses > 0 && !this.puedeAvanzar()) return;
    const b = this.mesBase();
    this.mesBase.set(new Date(b.getFullYear(), b.getMonth() + meses, 1));
  }

  /**
   * Elige el extremo que se está editando. La fecha fin puede quedar antes o después del inicio:
   * en reportes el rango suele ir hacia atrás. Si quedan invertidas, se ordenan solas.
   */
  elegir(dia: DiaCalendario) {
    if (dia.vacio || dia.bloqueado) return;
    const d = dia.fecha;
    if (this.editando() === 'inicio') {
      const fin = this.fin();
      if (fin && soloDia(d) <= soloDia(fin)) {
        this.fijar(d, fin);
        this.cerrar();
        return;
      }
      // Inicio posterior al fin anterior: se pide un fin nuevo (no se reordena con el fin viejo).
      if (fin) this.fin.set(null);
      this.inicio.set(inicioDia(d));
      this.editando.set('fin');
      return;
    }
    const ini = this.inicio();
    if (!ini) {
      this.inicio.set(inicioDia(d));
      return;
    }
    this.fijar(ini, d);
    this.cerrar();
  }

  /** Guarda el rango ordenado: inicio a las 00:00 y fin a las 23:59:59. */
  private fijar(x: Date, y: Date) {
    const [a, b] = soloDia(x) <= soloDia(y) ? [x, y] : [y, x];
    this.inicio.set(inicioDia(a));
    this.fin.set(finDia(b));
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
    this.editando.set('inicio');
  }

  hayFin() {
    const { a, b } = this.rangoVisible();
    return !!a && !!b && soloDia(a) !== soloDia(b);
  }

  esInicio(d: DiaCalendario) {
    const i = this.rangoVisible().a;
    return !d.vacio && !!i && soloDia(d.fecha) === soloDia(i);
  }

  esFin(d: DiaCalendario) {
    const f = this.rangoVisible().b;
    return !d.vacio && !!f && soloDia(d.fecha) === soloDia(f);
  }

  enRango(d: DiaCalendario) {
    const { a: i, b: f } = this.rangoVisible();
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
