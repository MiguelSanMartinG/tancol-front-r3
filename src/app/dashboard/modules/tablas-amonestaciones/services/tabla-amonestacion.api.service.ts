import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { map, timeout } from 'rxjs';
import { ProductoAmonestacionDisponible, TablaAmonestacion, TablaAmonestacionRequest } from './tabla-amonestacion.model';

@Injectable({ providedIn: 'root' })
export class TablaAmonestacionApiService {
  private http = inject(HttpClient);
  listar(filters: Record<string, string | boolean | undefined> = {}) {
    let params = new HttpParams();
    Object.entries(filters).forEach(([key, value]) => { if (value !== undefined && value !== '') params = params.set(key, String(value)); });
    return this.http.get<TablaAmonestacion[] | null>('tablas-amonestaciones', { params }).pipe(
      timeout({ first: 15000 }),
      map((items) => items ?? [])
    );
  }
  consultar(id: string) { return this.http.get<TablaAmonestacion>(`tablas-amonestaciones/${id}`); }
  crear(body: TablaAmonestacionRequest) { return this.http.post<TablaAmonestacion>('tablas-amonestaciones', body).pipe(timeout({ first: 15000 })); }
  actualizar(id: string, body: TablaAmonestacionRequest) { return this.http.put<TablaAmonestacion>(`tablas-amonestaciones/${id}`, body).pipe(timeout({ first: 15000 })); }
  eliminar(id: string) { return this.http.delete<void>(`tablas-amonestaciones/${id}`); }
  productosDisponibles(tablaId?: string) {
    const params = tablaId ? new HttpParams().set('tablaId', tablaId) : undefined;
    return this.http.get<ProductoAmonestacionDisponible[] | null>('tablas-amonestaciones/productos-disponibles', { params }).pipe(
      timeout({ first: 15000 }),
      map((items) => items ?? [])
    );
  }
}
