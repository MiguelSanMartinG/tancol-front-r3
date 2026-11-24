import { DestroyRef, Directive, OnInit, inject } from '@angular/core';
import { AbstractControl, FormGroupDirective } from '@angular/forms';
import { Subscription } from 'rxjs';

function dia(v: unknown): number | null {
  if (!v) return null;
  const d = new Date(v as string | number | Date);
  return Number.isNaN(d.getTime()) ? null : new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

function hoy(): number {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

/**
 * Filtros de consulta con «Fecha inicio» y «Fecha fin» (solo hoy y días anteriores).
 *
 * - Si se elige una **fecha fin anterior al inicio** (rango hacia atrás), se intercambian para consultar de la menor a la mayor.
 * - Si se cambia el **inicio a una fecha posterior al fin**, el fin se limpia para que el usuario elija el nuevo fin
 *   (antes se intercambiaban y el reporte salía con días de más sin aviso).
 * - Una fecha futura se ajusta a hoy.
 *
 * Uso: `<div [formGroup]="filtro" appRangoFechas>` (controles `fechaInicio` y `fechaFin` por defecto).
 */
@Directive({
  selector: '[appRangoFechas]',
  inputs: ['inicio: rangoInicio', 'fin: rangoFin'],
})
export class RangoFechasDirective implements OnInit {
  private readonly grupo = inject(FormGroupDirective);
  private readonly destroyRef = inject(DestroyRef);

  inicio = 'fechaInicio';
  fin = 'fechaFin';

  ngOnInit() {
    const ini = this.grupo.form.get(this.inicio);
    const fin = this.grupo.form.get(this.fin);
    if (!ini || !fin) return;
    const subs: Subscription[] = [
      ini.valueChanges.subscribe(() => this.cambioInicio(ini, fin)),
      fin.valueChanges.subscribe(() => this.cambioFin(ini, fin)),
    ];
    this.destroyRef.onDestroy(() => subs.forEach((s) => s.unsubscribe()));
  }

  private cambioInicio(ini: AbstractControl, fin: AbstractControl) {
    if (this.limitarAHoy(ini)) return;
    const a = dia(ini.value);
    const b = dia(fin.value);
    if (a !== null && b !== null && a > b) {
      fin.setValue(null);
      fin.markAsTouched();
    }
  }

  private cambioFin(ini: AbstractControl, fin: AbstractControl) {
    if (this.limitarAHoy(fin)) return;
    const a = dia(ini.value);
    const b = dia(fin.value);
    if (a === null || b === null || a <= b) return;
    const valorIni = ini.value;
    ini.setValue(fin.value, { emitEvent: false });
    fin.setValue(valorIni, { emitEvent: false });
    // Se notifica una sola vez, ya con el rango ordenado.
    ini.updateValueAndValidity();
    fin.updateValueAndValidity({ emitEvent: false });
  }

  /** Las consultas no aceptan fechas futuras: se ajustan a hoy. Devuelve true si cambió el valor. */
  private limitarAHoy(control: AbstractControl): boolean {
    const v = dia(control.value);
    if (v === null || v <= hoy()) return false;
    const original = new Date(control.value as string | number | Date);
    const ahora = new Date();
    original.setFullYear(ahora.getFullYear(), ahora.getMonth(), ahora.getDate());
    control.setValue(original);
    return true;
  }
}
