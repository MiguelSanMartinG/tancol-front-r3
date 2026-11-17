import { Component, computed, input } from '@angular/core';
import { TagModule } from 'primeng/tag';

type Severidad = 'success' | 'secondary' | 'info' | 'warn' | 'danger' | 'contrast';

const ESTATUS: Record<string, { etiqueta: string; severidad: Severidad }> = {
  BORRADOR: { etiqueta: 'Borrador', severidad: 'secondary' },
  'POR AUTORIZAR': { etiqueta: 'Por autorizar', severidad: 'warn' },
  AUTORIZAR: { etiqueta: 'Por autorizar', severidad: 'warn' },
  PENDIENTE: { etiqueta: 'Pendiente', severidad: 'info' },
  AUTORIZADO: { etiqueta: 'Autorizado', severidad: 'success' },
  AUTORIZADA: { etiqueta: 'Autorizada', severidad: 'success' },
  RECIBIDA: { etiqueta: 'Recibida', severidad: 'success' },
  COMPLETADA: { etiqueta: 'Completada', severidad: 'success' },
  FINALIZADA: { etiqueta: 'Finalizada', severidad: 'success' },
  FACTURADO: { etiqueta: 'Facturado', severidad: 'contrast' },
  CANCELADA: { etiqueta: 'Cancelada', severidad: 'danger' },
  CANCELADO: { etiqueta: 'Cancelado', severidad: 'danger' },
};

/** Estatus de solicitudes/órdenes/recepciones/liquidaciones con el chip (p-tag) del sistema. */
@Component({
  selector: 'app-badge-status-orden',
  imports: [TagModule],
  template: `@if (estatus(); as e) {<p-tag [value]="e.etiqueta" [severity]="e.severidad" />}`,
})
export class BadgeEstatusOrdenComponent {
  value = input<string>('');

  readonly estatus = computed(() => {
    const clave = (this.value() ?? '').toString().trim().toUpperCase().replace(/_/g, ' ');
    if (!clave) return null;
    return ESTATUS[clave] ?? {
      etiqueta: clave.charAt(0) + clave.slice(1).toLowerCase(),
      severidad: 'secondary' as Severidad,
    };
  });
}
