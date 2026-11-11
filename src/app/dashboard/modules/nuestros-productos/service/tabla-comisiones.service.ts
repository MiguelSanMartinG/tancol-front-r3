import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

export interface TablaComision {
  id: string;
  cantidadDesde: number;
  cantidadHasta: number;
  comision: number;
  createdAt: string;
  enabled: boolean;
  productoAlias: string;
  productoId: string;
  productoNombre: string;
  textoComision: string;
  updatedAt: string;
  ventaMinima: number;
}

export interface TablaComisionRequest {
  cantidadDesde: number;
  cantidadHasta: number;
  comision: number;
  idProducto: string;
  ventaMinima: number;
}

@Injectable({ providedIn: 'root' })
export class TablaComisionesService {
  private readonly endpoint = 'tablas-comisiones';

  constructor(private readonly http: HttpClient) {}

  getAll(): Observable<TablaComision[]> {
    return this.http.get<TablaComision[]>(this.endpoint);
  }

  create(request: TablaComisionRequest): Observable<TablaComision> {
    return this.http.post<TablaComision>(this.endpoint, request);
  }

  update(id: string, request: TablaComisionRequest): Observable<TablaComision> {
    return this.http.put<TablaComision>(`${this.endpoint}/${id}`, request);
  }

  delete(id: string): Observable<TablaComision> {
    return this.http.delete<TablaComision>(`${this.endpoint}/${id}`);
  }
}
