import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { MetaVentaRuta, MetaVentaRutaRequest } from './meta-venta-ruta.model';

@Injectable({ providedIn: 'root' })
export class MetaVentaRutaApiService {
  private http = inject(HttpClient);

  listar(filters: Record<string, string | boolean | undefined> = {}) {
    let params = new HttpParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== '') params = params.set(key, String(value));
    });
    return this.http.get<MetaVentaRuta[]>('meta-venta-ruta', { params });
  }

  consultar(id: string) {
    return this.http.get<MetaVentaRuta>(`meta-venta-ruta/${id}`);
  }

  crear(body: MetaVentaRutaRequest) {
    return this.http.post<MetaVentaRuta>('meta-venta-ruta', body);
  }

  actualizar(id: string, cantidadMinima: number) {
    return this.http.put<MetaVentaRuta>(`meta-venta-ruta/${id}`, { cantidadMinima });
  }

  cerrar(id: string) {
    return this.http.put<MetaVentaRuta>(`meta-venta-ruta/${id}/cerrar`, {});
  }
}
