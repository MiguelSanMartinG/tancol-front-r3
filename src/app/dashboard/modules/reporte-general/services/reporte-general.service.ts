import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export type ReporteGeneralTipo =
  | 'rg-credito'
  | 'rg-factura'
  | 'rg-nofactura'
  | 'rp-tcredito'
  | 'rp-tdebito';

export interface ReporteGeneralRangoRequest {
  fechaFin?: string;
  fechaInicio?: string;
}

export interface ReporteGeneralCorridasFilaResponse {
  columnas: Record<string, number>;
  empleadoId: string;
  nombreEmpleado: string;
  totalFila: number;
}

export interface ReporteGeneralCorridasResponse {
  columnas: string[];
  filas: ReporteGeneralCorridasFilaResponse[];
  granTotal: number;
  totalesPorColumna: Record<string, number>;
}

@Injectable({ providedIn: 'root' })
export class ReporteGeneralService {
  private readonly baseUrl = 'reportes/general';

  constructor(private http: HttpClient) {}

  getReporte(
    tipo: ReporteGeneralTipo | 'rg-nofactura-autoservicio',
    body: ReporteGeneralRangoRequest
  ): Observable<ReporteGeneralCorridasResponse> {
    return this.http.post<ReporteGeneralCorridasResponse>(`${this.baseUrl}/${tipo}`, body);
  }
}
