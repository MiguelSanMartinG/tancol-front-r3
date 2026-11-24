import { DatePipe, DecimalPipe } from '@angular/common';
import { Component, ElementRef, computed, effect, inject, input, output, signal, untracked } from '@angular/core';
import { TagModule } from 'primeng/tag';
import { AppPrimengModule } from '@shared/app-primeng/app-primeng.module';
import { AppSharedModule } from '@shared/app-shared.module';
import { InventarioDiarioService } from '../services/inventario-diario.service';
import { ESTATUS_SOLICITUD, EstatusSolicitud, SolicitudStock } from '../services/inventario-diario.models';

/** Paso del historial de una solicitud (detalle). */
interface Paso {
  titulo: string;
  quien: string | null;
  cuando: Date | null;
  detalle: string;
  estado: 'hecho' | 'actual' | 'pendiente' | 'cerrado';
}

/**
 * Solicitudes de stock del área — solo consulta. Se piden, ajustan, cancelan y reciben con firma
 * desde las tarjetas de «Inventario del día».
 */
@Component({
  selector: 'app-solicitudes-stock',
  imports: [AppPrimengModule, AppSharedModule, TagModule, DatePipe, DecimalPipe],
  templateUrl: './solicitudes.component.html',
  styleUrl: './solicitudes.component.scss',
})
export class SolicitudesStockComponent {
  readonly inv = inject(InventarioDiarioService);
  private readonly host = inject(ElementRef) as ElementRef<HTMLElement>;

  readonly areaId = input.required<string>();
  readonly empleadoId = input<string | null>(null);
  readonly inicio = input<Date | null>(null);
  readonly fin = input<Date | null>(null);
  /** Folio que se resalta al llegar desde una tarjeta. */
  readonly resaltar = input<string | null>(null);

  /** Ir a la tarjeta del insumo para atender una solicitud abierta. */
  readonly irATarjeta = output<string>();

  estatusDe(s: SolicitudStock) {
    return ESTATUS_SOLICITUD[s.estatus];
  }

  etiquetaEstatus(e: EstatusSolicitud) {
    return ESTATUS_SOLICITUD[e].label;
  }

  // ---------------------------------------------------------------- filas y filtros

  readonly filtroEstatus = signal<EstatusSolicitud | null>(null);

  /** Solicitudes del área en el rango (las abiertas se muestran aunque sean de días anteriores). */
  private readonly delArea = computed(() => {
    const ini = this.inicio()?.getTime() ?? -Infinity;
    const fin = this.fin()?.getTime() ?? Infinity;
    const emp = this.inv.empleado(this.empleadoId())?.nombre;
    return this.inv.solicitudes().filter((s) => {
      if (s.areaId !== this.areaId()) return false;
      const t = s.fechaSolicitud.getTime();
      const abierta = s.estatus === 'SOLICITADO' || s.estatus === 'ACEPTADO';
      if (!abierta && (t < ini || t > fin)) return false;
      if (emp && s.solicitadoPor !== emp) return false;
      return true;
    });
  });

  readonly solicitudes = computed(() => {
    const e = this.filtroEstatus();
    return e ? this.delArea().filter((s) => s.estatus === e) : this.delArea();
  });

  readonly contadores = computed(() => {
    const ss = this.delArea();
    const n = (e: EstatusSolicitud) => ss.filter((s) => s.estatus === e).length;
    return [
      { estatus: 'SOLICITADO' as const, label: 'Por atender (almacén)', total: n('SOLICITADO'), icono: 'pi pi-clock' },
      { estatus: 'ACEPTADO' as const, label: 'Por recibir y firmar', total: n('ACEPTADO'), icono: 'fa-solid fa-signature' },
      { estatus: 'RECIBIDO' as const, label: 'Recibidas', total: n('RECIBIDO'), icono: 'pi pi-check-circle' },
      { estatus: 'RECHAZADO' as const, label: 'Rechazadas', total: n('RECHAZADO'), icono: 'pi pi-ban' },
    ];
  });

  // ---- totalizador ----
  readonly resumen = computed(() => {
    const filas = new Map<string, { insumo: string; unidad: string; solicitudes: number; solicitado: number; aEntregar: number; recibido: number }>();
    for (const s of this.solicitudes()) {
      const ins = this.inv.insumo(s.insumoId);
      if (!ins) continue;
      const f = filas.get(s.insumoId) ?? { insumo: ins.nombre, unidad: ins.unidad, solicitudes: 0, solicitado: 0, aEntregar: 0, recibido: 0 };
      f.solicitudes += 1;
      f.solicitado += s.cantidadSolicitada;
      f.aEntregar += s.cantidadAEntregar ?? 0;
      f.recibido += s.firma ? s.cantidadRecibida ?? 0 : 0;
      filas.set(s.insumoId, f);
    }
    return [...filas.values()].sort((a, b) => a.insumo.localeCompare(b.insumo));
  });

  // ---------------------------------------------------------------- diálogos

  readonly detalle = signal<SolicitudStock | null>(null);

  constructor() {
    effect(() => {
      this.areaId();
      untracked(() => {
        this.filtroEstatus.set(null);
      });
    });
    // Al llegar desde una tarjeta, se lleva la fila a la vista.
    effect(() => {
      const folio = this.resaltar();
      if (!folio) return;
      setTimeout(() => this.host.nativeElement.querySelector(`[data-folio="${folio}"]`)?.scrollIntoView({ block: 'center', behavior: 'smooth' }), 150);
    });
  }

  esAbierta(s: SolicitudStock) {
    return s.estatus === 'SOLICITADO' || s.estatus === 'ACEPTADO';
  }

  filtrarEstatus(e: EstatusSolicitud) {
    this.filtroEstatus.update((actual) => (actual === e ? null : e));
  }

  /** Texto del ícono de firma (solo indicador). */
  textoFirma(s: SolicitudStock): string {
    if (s.firma) return `Recibido por ${s.recibidoPor ?? s.solicitadoPor}`;
    switch (s.estatus) {
      case 'ACEPTADO': return 'Pendiente: se recibe y firma desde la tarjeta';
      case 'SOLICITADO': return 'Esperando respuesta del almacén';
      case 'RECHAZADO': return 'Rechazada por el almacén';
      default: return 'Cancelada';
    }
  }

  atender(s: SolicitudStock) {
    this.detalle.set(null);
    this.irATarjeta.emit(s.insumoId);
  }

  /** Historial: Solicitado → respuesta del almacén → recibido. */
  pasos(s: SolicitudStock): Paso[] {
    const pasos: Paso[] = [
      { titulo: 'Solicitado', quien: s.solicitadoPor, cuando: s.fechaSolicitud, detalle: `${s.cantidadSolicitada} pedidos${s.nota ? ' · ' + s.nota : ''}`, estado: 'hecho' },
    ];
    if (s.estatus === 'CANCELADO') {
      pasos.push({ titulo: 'Cancelado', quien: s.solicitadoPor, cuando: null, detalle: 'Se canceló antes de que el almacén respondiera.', estado: 'cerrado' });
      return pasos;
    }
    if (s.estatus === 'RECHAZADO') {
      pasos.push({ titulo: 'Rechazado por el almacén', quien: s.confirmadoPor, cuando: s.fechaConfirmacion, detalle: s.comentario || 'Sin comentario', estado: 'cerrado' });
      return pasos;
    }
    pasos.push(
      s.confirmadoPor
        ? { titulo: 'Aceptado por el almacén', quien: s.confirmadoPor, cuando: s.fechaConfirmacion, detalle: `Entrega ${s.cantidadAEntregar}${s.comentario ? ' · ' + s.comentario : ''}`, estado: 'hecho' }
        : { titulo: 'Respuesta del almacén', quien: null, cuando: null, detalle: 'Pendiente', estado: 'actual' },
    );
    pasos.push(
      s.firma
        ? { titulo: 'Recibido y firmado', quien: s.recibidoPor, cuando: s.fechaRecepcion, detalle: `+${s.cantidadRecibida} al cupo del día`, estado: 'hecho' }
        : { titulo: 'Recibir y firmar', quien: null, cuando: null, detalle: s.confirmadoPor ? 'Pendiente de firma' : 'Después de que el almacén acepte', estado: s.confirmadoPor ? 'actual' : 'pendiente' },
    );
    return pasos;
  }

  /** Diferencias entre lo pedido, lo autorizado y lo recibido. */
  diferencia(s: SolicitudStock): string | null {
    if (s.firma && s.cantidadRecibida !== null && s.cantidadAEntregar !== null && s.cantidadRecibida < s.cantidadAEntregar) {
      return `Faltaron ${s.cantidadAEntregar - s.cantidadRecibida} por recibir`;
    }
    if (s.cantidadAEntregar !== null && s.cantidadAEntregar < s.cantidadSolicitada) {
      return `El almacén autorizó ${s.cantidadSolicitada - s.cantidadAEntregar} menos`;
    }
    return null;
  }
}
