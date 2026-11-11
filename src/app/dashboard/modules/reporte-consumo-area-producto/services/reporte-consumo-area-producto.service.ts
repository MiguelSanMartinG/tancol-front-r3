import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';

export interface ReporteConsumoAreaProductoRequest {
  fechaInicio: string;
  fechaFin: string;
  idEmpleados: string[];
  idInsumos: string[];
  idCategorias: string[];
  alias: string[];
}

export interface ReporteConsumoAreaProductoRow {
  fecha: string;
  empleado: string;
  insumo: string;
  cantidadSolicitada: number;
  comentarioPartida?: string | null;
}

export interface ReporteConsumoAreaProductoResponse {
  grupos: Array<{ area: string; insumo: string; cantidad: number; filas: ReporteConsumoAreaProductoRow[] }>;
  totalesPorEmpleado: Array<{ empleado: string; cantidad: number }>;
  totalesPorInsumo: Array<{ insumo: string; cantidad: number }>;
}

@Injectable({ providedIn: 'root' })
export class ReporteConsumoAreaProductoService {
  private http = inject(HttpClient);

  consultar(body: ReporteConsumoAreaProductoRequest) {
    return this.http.post<ReporteConsumoAreaProductoResponse>(
      'reportes/consumo-area-producto', body
    );
  }
}
