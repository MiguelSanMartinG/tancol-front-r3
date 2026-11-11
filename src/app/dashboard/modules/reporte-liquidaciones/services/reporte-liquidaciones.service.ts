import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface ReporteLiquidacionesRequest {
  cancelado: boolean;
  conceptosVenta: string[];
  descuento: boolean;
  f1: boolean;
  facturado: boolean;
  fechaFin?: any;
  fechaInicio?: any;
  idClientes: string[];
  idProductosComerciales: string[];
  idRutas: string[];
  tipoPago: string[];
}

export interface ReporteLiquidacionesItem {
  ayudantes: string;
  bloqueNota: string;
  cancelados: boolean;
  cantidad: number;
  conceptoVenta: string;
  descuento: boolean;
  f1: boolean;
  fecha: string;
  folio: string;
  folioNota: string;
  importe: number;
  nombreCliente: string;
  nombreProducto: string;
  nombreRuta: string;
  precioUnitario: number;
  tipoPago: string;
  vendedor_chofer: string;
}

@Injectable({ providedIn: 'root' })
export class ReporteLiquidacionesService {
  constructor(private http: HttpClient) {}

  getReport(body: ReporteLiquidacionesRequest): Observable<ReporteLiquidacionesItem[]> {
    return this.http.post<ReporteLiquidacionesItem[]>('reportes/liquidaciones', body);
  }
}

