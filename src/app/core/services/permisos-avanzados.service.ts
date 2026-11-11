import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';

export interface PermisoAvanzado {
  id: string;
  codigo: string;
  nombre: string;
  descripcion?: string | null;
}

export interface AsignacionPermisoAvanzado {
  id: string;
  empleadoId: string;
  nombreUsuario: string;
  nombreEmpleado: string;
  permisoId: string;
  codigo: string;
  nombrePermiso: string;
  asignadoPor: string;
}

@Injectable({ providedIn: 'root' })
export class PermisosAvanzadosService {
  private http = inject(HttpClient);

  listarCatalogo() { return this.http.get<PermisoAvanzado[]>('permisos-avanzados'); }

  listarAsignaciones(empleadoId?: string) {
    const params = empleadoId ? new HttpParams().set('empleadoId', empleadoId) : undefined;
    return this.http.get<AsignacionPermisoAvanzado[]>('permisos-avanzados/asignaciones', { params });
  }

  asignar(empleadoId: string, codigo: string) {
    return this.http.post<AsignacionPermisoAvanzado>('permisos-avanzados/asignaciones', { empleadoId, codigo });
  }

  quitar(id: string) { return this.http.delete<void>(`permisos-avanzados/asignaciones/${id}`); }

  tiene(codigo: string) {
    return this.http.get<{ codigo: string; tienePermiso: boolean }>(`permisos-avanzados/me/tiene/${codigo}`);
  }
}
