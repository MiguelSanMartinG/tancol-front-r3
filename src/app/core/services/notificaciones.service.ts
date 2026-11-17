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

export interface PresentacionTipoNotificacion {
  /** Clase de PrimeIcons, p. ej. 'pi pi-calendar-clock'. */
  icono: string;
  etiqueta: string;
}

const PRESENTACION_POR_DEFECTO: PresentacionTipoNotificacion = {
  icono: 'pi pi-exclamation-triangle',
  etiqueta: '',
};

/** Icono / etiqueta legible por tipo de notificación. Los tipos no listados usan el icono de alerta y su código. */
export const PRESENTACION_TIPOS_NOTIFICACION: Record<string, PresentacionTipoNotificacion> = {
  [TIPO_VIGENCIA_EMPLEADO]: { icono: 'pi pi-calendar-clock', etiqueta: 'Vigencia de empleado' },
};

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
