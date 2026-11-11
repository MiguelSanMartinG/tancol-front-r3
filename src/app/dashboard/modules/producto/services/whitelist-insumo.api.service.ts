import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

export interface WhitelistInsumoConfiguracion {
  usarWhitelist: boolean;
}

export interface WhitelistInsumoAsignacionDepartamentoRequest {
  idDepartamento: string;
  idProductos: string[];
  reemplazar: false;
}

export interface WhitelistInsumoAsignacionDepartamentoResponse {
  empleados: number;
  agregados: number;
  yaExistian: number;
  retirados: number;
}

export interface ProductosPermitidosResponse {
  usarWhitelist: boolean;
  productos: Array<{ idProducto: string }>;
}

@Injectable({ providedIn: 'root' })
export class WhitelistInsumoApiService {
  constructor(private readonly http: HttpClient) {}

  getConfiguracion(): Observable<WhitelistInsumoConfiguracion> {
    return this.http.get<WhitelistInsumoConfiguracion>('whitelist-insumo/configuracion');
  }

  actualizarConfiguracion(usarWhitelist: boolean): Observable<WhitelistInsumoConfiguracion> {
    return this.http.put<WhitelistInsumoConfiguracion>('whitelist-insumo/configuracion', { usarWhitelist });
  }

  asignarDepartamento(body: WhitelistInsumoAsignacionDepartamentoRequest): Observable<WhitelistInsumoAsignacionDepartamentoResponse> {
    return this.http.post<WhitelistInsumoAsignacionDepartamentoResponse>('whitelist-insumo/asignacion-departamento', body);
  }

  getProductosPermitidos(idEmpleado: string): Observable<ProductosPermitidosResponse> {
    return this.http.get<ProductosPermitidosResponse>(
      `whitelist-insumo/productos-permitidos?idEmpleado=${encodeURIComponent(idEmpleado)}`
    );
  }
}
