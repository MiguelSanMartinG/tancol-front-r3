import { DestroyRef, Directive, DoCheck, ElementRef, inject } from '@angular/core';
import { NgControl, Validators } from '@angular/forms';

/**
 * Marca con «*» la etiqueta de los campos obligatorios (Validators.required / requiredTrue).
 * Busca la <label> del mismo bloque que contiene el control; se reevalúa en cada ciclo,
 * así que también sigue a los validadores que se agregan o quitan dinámicamente.
 */
@Directive({ selector: '[formControlName],[formControl]' })
export class RequiredMarkerDirective implements DoCheck {
  private readonly ngControl = inject(NgControl, { self: true, optional: true });
  private readonly host = inject(ElementRef<HTMLElement>);
  private label: HTMLElement | null | undefined;
  private marked = false;

  constructor() {
    inject(DestroyRef).onDestroy(() => this.label?.classList.remove('field-required'));
  }

  ngDoCheck(): void {
    const control = this.ngControl?.control;
    if (!control) return;
    if (this.label === undefined) this.label = this.buscarEtiqueta();
    if (!this.label) return;
    const requerido = control.hasValidator(Validators.required) || control.hasValidator(Validators.requiredTrue);
    if (requerido !== this.marked) {
      this.marked = requerido;
      this.label.classList.toggle('field-required', requerido);
    }
  }

  private buscarEtiqueta(): HTMLElement | null {
    let nodo = (this.host.nativeElement as HTMLElement).parentElement;
    for (let nivel = 0; nodo && nivel < 4; nivel++, nodo = nodo.parentElement) {
      if (nodo.matches('form, p-table, table, tr')) return null;
      if (nodo.querySelectorAll('[formcontrolname]').length > 1) return null;
      const etiqueta = nodo.querySelector('label');
      if (etiqueta) return etiqueta.querySelector('app-span-required') ? null : etiqueta;
    }
    return null;
  }
}
