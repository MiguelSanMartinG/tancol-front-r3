import { HttpClient } from '@angular/common/http';
import { computed, Injectable, inject, signal } from '@angular/core';

export interface Notificacion {
  id: string;
  titulo: string;
  mensaje: string;
  tipo: string;
  leida: boolean;
  asignacionId?: string | null;
  clienteId?: string | null;
  metaVentaId?: string | null;
  productoId?: string | null;
  periodoInicio: string | null;
  periodoFin: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TipoNotificacion {
  id: string;
  codigo: string;
  nombre: string;
  descripcion: string | null;
}

/** Tipo de notificación que genera el back 2 días antes de la vigencia de un empleado Temporal/Practicante. */
export const TIPO_VIGENCIA_EMPLEADO = 'VIGENCIA_EMPLEADO_POR_VENCER';

/**
 * Inventario diario de insumos (2.ª etapa: el back los genera y se activan por rol en
 * Configuración → Roles de empleados → Permisos → «Notificaciones para este rol»).
 *
 * Textos que debe enviar el back en `mensaje` (el front los presenta en renglones):
 * - SOLICITUD_STOCK_NUEVA: «El área Producción solicitó 20 de Envase 20 L (SDS-00004) al Almacén Planta.»
 * - SOLICITUD_STOCK_RESPUESTA: «El Almacén Planta aceptó la solicitud SDS-00004 de Envase 20 L: entregará 20.»
 *   o «El Almacén Planta rechazó la solicitud SDS-00004 de Envase 20 L. Motivo: sin existencia.»
 * - DOTACION_INCOMPLETA: «Dotación incompleta en Producción: Bolsa de hielo 5 kg recibió 450 de 700 del Almacén Planta.»
 */
export const TIPO_SOLICITUD_STOCK_NUEVA = 'SOLICITUD_STOCK_NUEVA';
export const TIPO_SOLICITUD_STOCK_RESPUESTA = 'SOLICITUD_STOCK_RESPUESTA';
export const TIPO_DOTACION_INCOMPLETA = 'DOTACION_INCOMPLETA';

/** A dónde lleva el aviso al atenderlo. */
export interface DestinoNotificacion {
  etiqueta: string;
  ruta: string;
  queryParams?: Record<string, string>;
}

export interface PresentacionTipoNotificacion {
  /** Clase de PrimeIcons, p. ej. 'pi pi-calendar-clock'. */
  icono: string;
  etiqueta: string;
  /** Pantalla donde se atiende el aviso (opcional). */
  destino?: (n: Notificacion) => DestinoNotificacion | null;
}

const FOLIO_SOLICITUD = /SDS-\d+/;

function conFolio(n: Notificacion): Record<string, string> | undefined {
  const folio = n.mensaje?.match(FOLIO_SOLICITUD)?.[0];
  return folio ? { folio } : undefined;
}

const PRESENTACION_POR_DEFECTO: PresentacionTipoNotificacion = {
  icono: 'pi pi-exclamation-triangle',
  etiqueta: '',
};

/** Icono / etiqueta legible por tipo de notificación. Los tipos no listados usan el icono de alerta y su código. */
export const PRESENTACION_TIPOS_NOTIFICACION: Record<string, PresentacionTipoNotificacion> = {
  [TIPO_VIGENCIA_EMPLEADO]: { icono: 'pi pi-calendar-clock', etiqueta: 'Vigencia de empleado' },
  [TIPO_SOLICITUD_STOCK_NUEVA]: {
    icono: 'pi pi-send',
    etiqueta: 'Solicitud de stock',
    destino: (n) => ({ etiqueta: 'Atender solicitud', ruta: '/dashboard/principal/confirmacion-stock', queryParams: conFolio(n) }),
  },
  [TIPO_SOLICITUD_STOCK_RESPUESTA]: {
    icono: 'pi pi-inbox',
    etiqueta: 'Respuesta del almacén',
    destino: (n) => ({
      etiqueta: /acept/i.test(n.mensaje ?? '') ? 'Recibir y firmar' : 'Ver en inventario diario',
      ruta: '/dashboard/principal/inventario-diario',
      queryParams: conFolio(n),
    }),
  },
  [TIPO_DOTACION_INCOMPLETA]: {
    icono: 'pi pi-exclamation-triangle',
    etiqueta: 'Dotación incompleta',
    destino: () => ({ etiqueta: 'Ver inventario diario', ruta: '/dashboard/principal/inventario-diario' }),
  },
};

/** Pantalla donde se atiende la notificación, si su tipo tiene una. */
export function destinoNotificacion(n: Notificacion): DestinoNotificacion | null {
  return PRESENTACION_TIPOS_NOTIFICACION[n.tipo]?.destino?.(n) ?? null;
}

export function presentacionTipoNotificacion(tipo: string | null | undefined): PresentacionTipoNotificacion {
  const conocido = tipo ? PRESENTACION_TIPOS_NOTIFICACION[tipo] : undefined;
  return conocido ?? { ...PRESENTACION_POR_DEFECTO, etiqueta: tipo ?? '' };
}

@Injectable({ providedIn: 'root' })
export class NotificacionesService {
  private http = inject(HttpClient);
  notificaciones = signal<Notificacion[]>([]);
  pendientes = computed(() => this.notificaciones().filter((item) => !item.leida));
  noLeidas = computed(() => this.pendientes().length);
  /** Notificaciones no leídas de vigencia de empleado por vencer. */
  vigenciasPorVencer = computed(() => this.pendientes().filter((item) => item.tipo === TIPO_VIGENCIA_EMPLEADO));

  listarTipos() {
    return this.http.get<TipoNotificacion[]>('notificaciones/tipos');
  }

  listarTiposPorRol(roleId: number) {
    return this.http.get<TipoNotificacion[]>(`notificaciones/roles/${roleId}`);
  }

  reemplazarTiposPorRol(roleId: number, tipos: string[]) {
    return this.http.put<TipoNotificacion[]>(`notificaciones/roles/${roleId}`, { tipos });
  }

  actualizarTipo(codigo: string, nombre: string, descripcion: string) {
    return this.http.put<TipoNotificacion>(`notificaciones/tipos/${codigo}`, { nombre, descripcion });
  }

  cargar() {
    this.http.get<Notificacion[]>('notificaciones').subscribe({
      next: (items) => this.notificaciones.set(items),
      error: () => this.notificaciones.set([]),
    });
  }

  marcarComoLeida(notificacion: Notificacion) {
    if (notificacion.leida) return;

    this.http.put<Notificacion>(`notificaciones/${notificacion.id}/leer`, {}).subscribe(() => {
      this.notificaciones.update((items) =>
        items.map((item) => item.id === notificacion.id ? { ...item, leida: true } : item)
      );
    });
  }

  marcarTodasComoLeidas() {
    for (const item of this.notificaciones()) {
      this.marcarComoLeida(item);
    }
  }
}
