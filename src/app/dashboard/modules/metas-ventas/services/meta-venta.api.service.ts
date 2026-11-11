import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { MetaVenta, MetaVentaRevision, MetaVentaRequest } from './meta-venta.model';

@Injectable({ providedIn: 'root' })
export class MetaVentaApiService {
  private http = inject(HttpClient);

  listar(filters: Record<string, string | boolean | undefined> = {}) {
    let params = new HttpParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== '') params = params.set(key, String(value));
    });
    return this.http.get<MetaVenta[]>('meta-venta', { params });
  }

  consultar(id: string) {
    return this.http.get<MetaVenta>(`meta-venta/${id}`);
  }

  crear(body: MetaVentaRequest) {
    return this.http.post<MetaVenta>('meta-venta', body);
  }

  actualizar(id: string, cantidadMinima: number) {
    return this.http.put<MetaVenta>(`meta-venta/${id}`, { cantidadMinima });
  }

  cerrar(id: string) {
    return this.http.put<MetaVenta>(`meta-venta/${id}/cerrar`, {});
  }

  revisar() {
    return this.http.post<MetaVentaRevision>('meta-venta/revisar', {});
  }
}
