import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface VolumenVentasEmpleadoDiaRequest {
  fechaInicio: string;
  fechaFin: string;
  idEmpledos: string[];
  idProductos: string[];
  idRutas?: string[];
  idConceptosVenta?: string[];
  facturado?: boolean;
}

export interface VolumenVentasEmpleadoDiaItem {
  cantidadVendida: number;
  fecha: string;
  facturados?: boolean;
  idEmpleado: number;
  nombreRuta?: string;
  nombre: string;
  conceptoVenta?: string;
  producto: string;
  importe: number;
}

@Injectable({ providedIn: 'root' })
export class ReporteVolumenVentasEmpleadoDiaService {
  constructor(private http: HttpClient) {}

  getReporte(body: VolumenVentasEmpleadoDiaRequest): Observable<VolumenVentasEmpleadoDiaItem[]> {
    return this.http.post<VolumenVentasEmpleadoDiaItem[]>('reportes/volumen-ventas-empleado-dia', body);
  }
}
