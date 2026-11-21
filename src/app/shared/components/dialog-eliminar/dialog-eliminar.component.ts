import { Component, ElementRef, input, model, output, viewChild } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';

export interface DetalleEliminar {
  label: string;
  value: unknown;
}

/**
 * Confirmación única para eliminar (o desactivar) un registro.
 * Ícono de advertencia, título, aviso de que no se puede deshacer, resumen del registro
 * y dos acciones: Cancelar (con el foco por defecto) y la acción destructiva.
 */
@Component({
  selector: 'app-dialog-eliminar',
  imports: [ButtonModule, DialogModule],
  templateUrl: './dialog-eliminar.component.html',
})
export class DialogEliminarComponent {
  readonly visible = model(false);
  readonly title = input('Eliminar registro');
  readonly message = input('¿Seguro que deseas eliminar este registro? Esta acción no se puede deshacer.');
  readonly confirmLabel = input('Eliminar');
  readonly confirmIcon = input('pi pi-trash');
  readonly details = input<DetalleEliminar[]>([]);
  readonly loading = input(false);

  readonly confirm = output<void>();
  readonly cancel = output<void>();

  private readonly botonCancelar = viewChild('cancelarRef', { read: ElementRef<HTMLElement> });

  alMostrar() {
    // El foco inicial va a «Cancelar» para que Enter no elimine por accidente.
    setTimeout(() => this.botonCancelar()?.nativeElement.querySelector('button')?.focus());
  }

  cancelar() {
    this.visible.set(false);
    this.cancel.emit();
  }

  valor(v: unknown): string {
    if (v === true) return 'Activo';
    if (v === false) return 'Inactivo';
    if (v === null || v === undefined || v === '') return '—';
    return String(v);
  }
}
