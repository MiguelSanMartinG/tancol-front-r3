import { Component, computed, input } from '@angular/core';
import { TagModule } from 'primeng/tag';

type Severidad = 'success' | 'secondary' | 'info' | 'warn' | 'danger' | 'contrast';

const PRIORIDADES: Record<string, { etiqueta: string; severidad: Severidad }> = {
  ALTA: { etiqueta: 'Alta', severidad: 'danger' },
  MEDIA: { etiqueta: 'Media', severidad: 'warn' },
  BAJA: { etiqueta: 'Baja', severidad: 'info' },
};

/** Prioridad de solicitudes/órdenes con el mismo chip (p-tag) que el resto del sistema. */
@Component({
  selector: 'app-badge-prioridad-orden',
  imports: [TagModule],
  template: `@if (prioridad(); as p) {<p-tag [value]="p.etiqueta" [severity]="p.severidad" />}`,
})
export class BadgePrioridadOrdenComponent {
  value = input<string>('');

  readonly prioridad = computed(() => {
    const clave = (this.value() ?? '').toString().trim().toUpperCase();
    if (!clave) return null;
    return PRIORIDADES[clave] ?? { etiqueta: clave.charAt(0) + clave.slice(1).toLowerCase(), severidad: 'secondary' as Severidad };
  });
}
