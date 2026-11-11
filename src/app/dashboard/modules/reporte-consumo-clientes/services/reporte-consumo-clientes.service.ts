import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

export interface ConsumoCliente {
  alias?: string;
  nombre?: string;
  nombreComercial?: string;
  razonSocial?: string;
  cantidadVendida: number;
}

@Injectable({ providedIn: 'root' })
export class ReporteConsumoClientesService {
  listAll = signal<ConsumoCliente[]>([]);

  constructor(private http: HttpClient) {}

  getAll(report:Reporte): Observable<ConsumoCliente[]> {
    const body = {
      fechaInicio: report.fechaInicio,
      fechaFin: report.fechaFin,
      idCliente: report.cliente,
      idProductosComerciales: report.producto,
    };

    return this.http
      .post<ConsumoCliente[]>('reportes/volumen-ventas-cliente', body)
      .pipe(tap((resp) => this.listAll.set(resp)));
  }
}

export interface Reporte{
  cliente:string[];
  producto:string[];
  fechaInicio:string;
  fechaFin:string;
  size:number | null;
  page:number;
}
