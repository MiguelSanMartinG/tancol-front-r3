import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

export interface ReporteVentasEmpleadosMetasRequest {
  fechaInicio: string;
  fechaFin: string;
  idProductos: string[];
}

export interface ReporteVentasEmpleadosMetasFila {
  empleadoId: string;
  empleadoNombre: string;
  productoId: string;
  productoNombre: string;
  productoAlias: string | null;
  ventaMinima: number | null;
  ventaSemana: number;
  alcanceObjetivo: number | null;
  comisionSugerida: number | null;
}

@Injectable({ providedIn: 'root' })
export class ReporteVentasEmpleadosMetasService {
  private readonly http = inject(HttpClient);

  consultar(body: ReporteVentasEmpleadosMetasRequest): Observable<ReporteVentasEmpleadosMetasFila[]> {
    return this.http.post<ReporteVentasEmpleadosMetasFila[]>('reportes/ventas-empleados-metas', body);
  }
}
