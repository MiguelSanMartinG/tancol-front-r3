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

@Injectable({ providedIn: 'root' })
export class NotificacionesService {
  private http = inject(HttpClient);
  notificaciones = signal<Notificacion[]>([]);
  pendientes = computed(() => this.notificaciones().filter((item) => !item.leida));
  noLeidas = computed(() => this.pendientes().length);

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
}
