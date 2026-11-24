import { DestroyRef, Directive, OnInit, inject } from '@angular/core';
import { AbstractControl, FormGroupDirective } from '@angular/forms';
import { Subscription, merge } from 'rxjs';

function dia(v: unknown): number | null {
  if (!v) return null;
  const d = new Date(v as string | number | Date);
  return Number.isNaN(d.getTime()) ? null : new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

/**
 * Filtros de consulta con «Fecha inicio» y «Fecha fin»: la fecha fin se puede elegir antes que el inicio
 * (en reportes el rango suele ir hacia atrás). Si quedan invertidas, se intercambian solas para que la
 * consulta siempre vaya de la fecha menor a la mayor.
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
    const sub: Subscription = merge(ini.valueChanges, fin.valueChanges).subscribe(() => this.ordenar(ini, fin));
    this.destroyRef.onDestroy(() => sub.unsubscribe());
  }

  private ordenar(ini: AbstractControl, fin: AbstractControl) {
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
}
