import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface VolumenVentasEmpleadoRequest {
  fechaInicio: string;
  fechaFin: string;
  idEmpledos: string[];
  idProductos: string[];
  idRutas?: string[];
}

export interface VolumenVentasEmpleadoItem {
  cantidadVendida: number;
  idEmpleado: string;
  nombre: string;
  producto: string;
}

@Injectable({ providedIn: 'root' })
export class ReporteVolumenVentasEmpleadoService {
  constructor(private http: HttpClient) {}

  getReporte(body: VolumenVentasEmpleadoRequest): Observable<VolumenVentasEmpleadoItem[]> {
    return this.http.post<VolumenVentasEmpleadoItem[]>('reportes/volumen-ventas-empleado', body);
  }
}
