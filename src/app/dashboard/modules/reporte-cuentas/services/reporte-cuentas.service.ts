import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface ReporteCuentasRequest {
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
  x: string;
}

export interface ReporteCuentasItem {
  ayudantes: string;
  bloqueNota: string;
  cancelados: boolean;
  cantidad: number;
  conceptoVenta: string;
  cuentaA: number;
  cuentaB: number;
  descuento: boolean;
  descuentoEfectuado: number;
  estadoLiquidacion: string;
  f1: boolean;
  facturados: boolean;
  fecha: string;
  folio: string;
  importe: number;
  nombreCliente: string;
  nombreProducto: string;
  nombreRuta: string;
  precioUnitario: number;
  tipoPago: string;
  vendedor_chofer: string;
}

@Injectable({ providedIn: 'root' })
export class ReporteCuentasService {
  constructor(private http: HttpClient) {}

  getReport(body: ReporteCuentasRequest): Observable<ReporteCuentasItem[]> {
    return this.http.post<ReporteCuentasItem[]>('reportes/liquidaciones', body);
  }
}
