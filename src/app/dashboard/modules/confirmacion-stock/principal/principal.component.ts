import { DatePipe, DecimalPipe } from '@angular/common';
import { Component, computed, effect, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { InputNumberModule } from 'primeng/inputnumber';
import { TagModule } from 'primeng/tag';
import { AppPrimengModule } from '@shared/app-primeng/app-primeng.module';
import { HeaderComponent } from '@shared/components/header/header.component';
import { BotonRegresarComponent } from '@shared/components/boton-regresar/boton-regresar.component';
import { InventarioDiarioService } from '../../inventario-diario/services/inventario-diario.service';
import { ESTATUS_SOLICITUD, SolicitudStock } from '../../inventario-diario/services/inventario-diario.models';

type Vista = 'pendientes' | 'todas';

/** Responsable de almacén: acepta (ajustando la cantidad) o rechaza las solicitudes de stock de las áreas. */
@Component({
  selector: 'app-confirmacion-stock',
  imports: [AppPrimengModule, FormsModule, InputNumberModule, TagModule, DatePipe, DecimalPipe, HeaderComponent, BotonRegresarComponent],
  templateUrl: './principal.component.html',
  styleUrl: './principal.component.scss',
})
export class ConfirmacionStockComponent {
  readonly inv = inject(InventarioDiarioService);
  private readonly toast = inject(MessageService);

  readonly estatus = ESTATUS_SOLICITUD;

  estatusDe(s: SolicitudStock) {
    return ESTATUS_SOLICITUD[s.estatus];
  }
  /** Folio que llega desde la notificación: se resalta y se lleva a la vista. */
  readonly folioResaltado = toSignal(inject(ActivatedRoute).queryParamMap, { requireSync: true });
  readonly resaltar = computed(() => this.folioResaltado().get('folio'));

  readonly vista = signal<Vista>('pendientes');
  readonly areaId = signal<string | null>(null);
  readonly areasOpciones = this.inv.areas.map((a) => ({ label: a.nombre, value: a.id }));

  readonly filas = computed(() =>
    this.inv.solicitudes().filter(
      (s) => (this.vista() === 'todas' || s.estatus === 'SOLICITADO') && (!this.areaId() || s.areaId === this.areaId()),
    ),
  );

  constructor() {
    effect(() => {
      const folio = this.resaltar();
      if (!folio) return;
      const s = this.inv.solicitudes().find((x) => x.folio === folio);
      // Si ya se atendió, se muestra en «Todas».
      if (s && s.estatus !== 'SOLICITADO') this.vista.set('todas');
      setTimeout(() => document.querySelector(`[data-folio="${folio}"]`)?.scrollIntoView({ block: 'center', behavior: 'smooth' }), 200);
    });
  }

  /** Captura por fila: cantidad a entregar y comentario. */
  readonly borrador: Record<string, { cantidad: number | null; comentario: string }> = {};
  readonly dlg = signal<{ accion: 'aceptar' | 'rechazar'; solicitud: SolicitudStock } | null>(null);

  captura(s: SolicitudStock) {
    return (this.borrador[s.id] ??= { cantidad: s.cantidadSolicitada, comentario: '' });
  }

  existencia(s: SolicitudStock) {
    return this.inv.existencia(s.areaId, s.insumoId);
  }

  confirmar() {
    const d = this.dlg();
    if (!d) return;
    const c = this.captura(d.solicitud);
    const insumo = this.inv.insumo(d.solicitud.insumoId)?.nombre;
    if (d.accion === 'aceptar') {
      this.inv.aceptarSolicitud(d.solicitud.id, c.cantidad ?? d.solicitud.cantidadSolicitada, c.comentario.trim());
      this.toast.add({ key: 'top-right', severity: 'success', summary: 'Solicitud aceptada', detail: `${d.solicitud.folio} · ${insumo}: entregar ${c.cantidad}. Se notificó al solicitante.` });
    } else {
      this.inv.rechazarSolicitud(d.solicitud.id, c.comentario.trim());
      this.toast.add({ key: 'top-right', severity: 'info', summary: 'Solicitud rechazada', detail: `${d.solicitud.folio} · Se notificó al solicitante.` });
    }
    delete this.borrador[d.solicitud.id];
    this.dlg.set(null);
  }
}
