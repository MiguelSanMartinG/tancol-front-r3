import { NotificacionesService, TIPO_SOLICITUD_STOCK_NUEVA, TIPO_SOLICITUD_STOCK_RESPUESTA } from '@app/core/services/notificaciones.service';
import { DatePipe, DecimalPipe } from '@angular/common';
import { Component, computed, effect, inject, signal, untracked } from '@angular/core';
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
  readonly areasOpciones = computed(() => this.inv.areas().map((a) => ({ label: a.nombre, value: a.id })));
  /** Ya se consultaron los permisos (evita mostrar el aviso mientras cargan). */
  readonly listo = signal(false);
  readonly guardando = signal(false);

  readonly filas = computed(() =>
    this.inv.solicitudes().filter(
      (s) => (this.vista() === 'todas' || s.estatus === 'SOLICITADO') && (!this.areaId() || s.areaId === this.areaId()),
    ),
  );

  private readonly avisos = inject(NotificacionesService);

  constructor() {
    // Si llega un aviso de solicitud de stock, la pantalla se actualiza sola.
    effect(() => {
      const hay = this.avisos.recientes().some((n) => n.tipo === TIPO_SOLICITUD_STOCK_NUEVA || n.tipo === TIPO_SOLICITUD_STOCK_RESPUESTA);
      if (hay) untracked(() => void this.inv.actualizarPorAviso(null));
    });
    void this.inv.cargarInicial().then(() => this.listo.set(true));

    effect(() => {
      const todas = this.vista() === 'todas';
      untracked(() => void this.inv.cargarSolicitudes(todas ? {} : { estatus: 'SOLICITADO' }));
    });

    effect(() => {
      const folio = this.resaltar();
      if (folio) untracked(() => void this.mostrarFolio(folio));
    });

    // Lleva la fila a la vista una vez, cuando ya cargó.
    let desplazadoA: string | null = null;
    effect(() => {
      const folio = this.resaltar();
      if (!folio || folio === desplazadoA || !this.filas().some((s) => s.folio === folio)) return;
      desplazadoA = folio;
      setTimeout(() => document.querySelector(`[data-folio="${folio}"]`)?.scrollIntoView({ block: 'center', behavior: 'smooth' }), 200);
    });
  }

  /** Si ya se atendió, se muestra en «Todas». */
  private async mostrarFolio(folio: string) {
    const s = await this.inv.buscarSolicitud(folio);
    if (s && s.estatus !== 'SOLICITADO' && folio === this.resaltar()) this.vista.set('todas');
  }

  /** Captura por fila: cantidad a entregar y comentario. */
  readonly borrador: Record<string, { cantidad: number | null; comentario: string }> = {};
  readonly dlg = signal<{ accion: 'aceptar' | 'rechazar'; solicitud: SolicitudStock } | null>(null);

  captura(s: SolicitudStock) {
    return (this.borrador[s.id] ??= { cantidad: s.cantidadSolicitada, comentario: '' });
  }

  async confirmar() {
    const d = this.dlg();
    if (!d || this.guardando()) return;
    const s = d.solicitud;
    const c = this.captura(s);
    const cantidad = c.cantidad ?? s.cantidadSolicitada;
    if (d.accion === 'aceptar' && cantidad > s.existencia) return;
    this.guardando.set(true);
    const error = d.accion === 'aceptar'
      ? await this.inv.aceptarSolicitud(s, cantidad, c.comentario.trim())
      : await this.inv.rechazarSolicitud(s, c.comentario.trim());
    this.guardando.set(false);
    if (error) {
      this.toast.add({ key: 'top-right', severity: 'warn', summary: d.accion === 'aceptar' ? 'No se aceptó' : 'No se rechazó', detail: error });
      return;
    }
    if (d.accion === 'aceptar') {
      this.toast.add({ key: 'top-right', severity: 'success', summary: 'Solicitud aceptada', detail: `${s.folio} · ${s.insumoNombre}: entregar ${cantidad}. Se notificó al solicitante.` });
    } else {
      this.toast.add({ key: 'top-right', severity: 'info', summary: 'Solicitud rechazada', detail: `${s.folio} · Se notificó al solicitante.` });
    }
    delete this.borrador[s.id];
    this.dlg.set(null);
  }
}
