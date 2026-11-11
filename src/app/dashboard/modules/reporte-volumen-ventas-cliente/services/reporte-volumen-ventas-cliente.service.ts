import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface VolumenVentasClienteRequest {
  fechaInicio: string;
  fechaFin: string;
  idCliente: string[];
  idProductosComerciales: string[];
}

export interface VolumenVentasClienteItem {
  alias?: string;
  nombre?: string;
  nombreComercial?: string;
  razonSocial?: string;
  cantidadVendida: number;
  idCliente?: string;
  cliente?: string;
  producto?: string;
}

@Injectable({ providedIn: 'root' })
export class ReporteVolumenVentasClienteService {
  constructor(private http: HttpClient) {}

  getReporte(body: VolumenVentasClienteRequest): Observable<VolumenVentasClienteItem[]> {
    return this.http.post<VolumenVentasClienteItem[]>('reportes/volumen-ventas-cliente', body);
  }
}
