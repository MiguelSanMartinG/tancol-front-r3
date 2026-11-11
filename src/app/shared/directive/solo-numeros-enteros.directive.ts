import { Directive, HostListener, Input } from '@angular/core';
import { NgControl } from '@angular/forms';

@Directive({
  selector: '[soloNumerosEnteros]',
  standalone: true
})
export class SoloNumerosEnterosDirective {
  // @Input() max = 366;
  @Input() min = 0;

  constructor(private control: NgControl) {}

  @HostListener('input', ['$event'])
  onInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    let value = input.value;

    // Elimina cualquier caracter que no sea dígito
    value = value.replace(/[^0-9]/g, '');

    // Convierte a número y aplica límites
    let num:any = parseInt(value, 10);
    if (isNaN(num)) num = null;
    else {
      // if (num > this.max) num = this.max;
      if (num < this.min) num = this.min;
    }

    // Asigna el nuevo valor al input
    const newValue = num !== null ? String(num) : '';
    if (input.value !== newValue) {
      input.value = newValue;
    }

    // Actualiza el modelo de Angular
    if (this.control?.control) {
      this.control.control.setValue(num, { emitEvent: false });
    }
  }
}
