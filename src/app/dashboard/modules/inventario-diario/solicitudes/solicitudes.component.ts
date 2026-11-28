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
  readonly insumoId = input<string | null>(null);
  /** «Mis solicitudes»: solo las que pidió el usuario en sesión. */
  readonly soloMias = signal(false);
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
  readonly porPagina = signal(20);
  /** Primera fila de la página visible. */
  readonly primero = signal(0);

  /** Solicitudes del área en el rango (las abiertas se muestran aunque sean de días anteriores). */
  private readonly delArea = computed(() => {
    // El rango y el empleado los filtra el backend; insumo y firmado, aquí.
    const insumo = this.insumoId();
    const yo = this.soloMias() ? this.inv.idUsuarioActual() : null;
    return this.inv.solicitudes().filter((s) =>
      s.areaId === this.areaId() &&
      (!insumo || s.insumoId === insumo) &&
      (!yo || s.solicitadoPorId === yo),
    );
  });

  readonly solicitudes = computed(() => {
    const e = this.filtroEstatus();
    // «Declinadas / canceladas» agrupa los dos estatus.
    const grupo: EstatusSolicitud[] = e === 'DECLINADO' ? ['DECLINADO', 'CANCELADO'] : e ? [e] : [];
    return grupo.length ? this.delArea().filter((s) => grupo.includes(s.estatus)) : this.delArea();
  });

  /** Clic en la fila: abre el detalle (salvo que el clic sea en un botón). */
  abrirFila(s: SolicitudStock, event: Event) {
    if ((event.target as HTMLElement).closest('button, a')) return;
    this.detalle.set(s);
  }

  readonly contadores = computed(() => {
    const ss = this.delArea();
    const n = (...es: EstatusSolicitud[]) => ss.filter((s) => es.includes(s.estatus)).length;
    return [
      { estatus: 'SOLICITADO' as const, label: 'Por atender (almacén)', total: n('SOLICITADO'), icono: 'pi pi-clock' },
      { estatus: 'ACEPTADO' as const, label: 'Por recibir y firmar', total: n('ACEPTADO'), icono: 'fa-solid fa-signature' },
      { estatus: 'RECIBIDO' as const, label: 'Recibidas', total: n('RECIBIDO'), icono: 'pi pi-check-circle' },
      { estatus: 'RECHAZADO' as const, label: 'Rechazadas', total: n('RECHAZADO'), icono: 'pi pi-ban' },
      { estatus: 'DECLINADO' as const, label: 'Declinadas / canceladas', total: n('DECLINADO', 'CANCELADO'), icono: 'pi pi-times-circle' },
    ];
  });

  // ---- totalizador ----
  readonly resumen = computed(() => {
    const filas = new Map<string, { insumo: string; unidad: string; solicitudes: number; solicitado: number; aEntregar: number; recibido: number }>();
    for (const s of this.solicitudes()) {
      const f = filas.get(s.insumoId) ?? { insumo: s.insumoNombre, unidad: s.unidad, solicitudes: 0, solicitado: 0, aEntregar: 0, recibido: 0 };
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
    effect(() => {
      const filtro = { areaId: this.areaId(), empleadoId: this.empleadoId(), inicio: this.inicio(), fin: this.fin() };
      untracked(() => void this.inv.cargarSolicitudes(filtro));
    });
    // Al llegar desde una tarjeta, se lleva la fila a la vista (una vez, cuando ya cargó).
    let desplazadoA: string | null = null;
    effect(() => {
      const folio = this.resaltar();
      if (!folio || folio === desplazadoA || !this.solicitudes().some((s) => s.folio === folio)) return;
      desplazadoA = folio;
      const i = this.solicitudes().findIndex((s) => s.folio === folio);
      untracked(() => this.primero.set(Math.floor(i / this.porPagina()) * this.porPagina()));
      setTimeout(() => this.host.nativeElement.querySelector(`[data-folio="${folio}"]`)?.scrollIntoView({ block: 'center', behavior: 'smooth' }), 150);
    });
  }

  esAbierta(s: SolicitudStock) {
    return s.estatus === 'SOLICITADO' || s.estatus === 'ACEPTADO';
  }

  filtrarEstatus(e: EstatusSolicitud) {
    this.primero.set(0);
    this.filtroEstatus.update((actual) => (actual === e ? null : e));
  }

  /** Texto del ícono de la firma de entrega del almacén (solo indicador). */
  textoFirmaAlmacen(s: SolicitudStock): string {
    if (s.firmaAlmacen) return `Entregó: ${s.confirmadoPor ?? s.almacenNombre}`;
    if (s.estatus === 'RECHAZADO' || s.estatus === 'CANCELADO' || s.estatus === 'DECLINADO') return 'Sin entrega';
    return s.confirmadoPor ? `Pendiente: firma de ${s.confirmadoPor}` : 'Pendiente: firma del almacén';
  }

  /** Texto del ícono de firma de recibido (solo indicador). */
  textoFirma(s: SolicitudStock): string {
    if (s.firma) return `Recibió: ${s.recibidoPor ?? s.solicitadoPor}`;
    switch (s.estatus) {
      case 'ACEPTADO': return 'Pendiente: se recibe y firma desde la tarjeta';
      case 'SOLICITADO': return 'Esperando respuesta del almacén';
      case 'RECHAZADO': return 'Rechazada por el almacén';
      case 'DECLINADO': return 'Declinada: no se recibió';
      default: return 'Cancelada';
    }
  }

  atender(s: SolicitudStock) {
    this.detalle.set(null);
    this.irATarjeta.emit(s.insumoId);
  }

  /** Historial: Solicitado → respuesta del almacén → recibido. */
  pasos(s: SolicitudStock): Paso[] {
    if (s.tipo === 'DOTACION') {
      return [{
        titulo: 'Cupo del día confirmado', quien: s.solicitadoPor, cuando: s.fechaSolicitud,
        detalle: `Se entregaron ${s.cantidadAEntregar ?? s.cantidadRecibida ?? s.cantidadSolicitada}${s.nota ? ' · ' + s.nota : ''}`, estado: 'hecho',
      }];
    }
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
    if (s.estatus === 'DECLINADO') {
      pasos.push({ titulo: 'Declinado por el solicitante', quien: s.solicitadoPor, cuando: s.fechaRecepcion, detalle: s.comentario || 'No se recibió; el insumo se quedó en el almacén.', estado: 'cerrado' });
      return pasos;
    }
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
