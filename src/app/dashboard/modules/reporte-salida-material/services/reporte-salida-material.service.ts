import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

export interface SalidaMaterial {
  idPartida: string;
  idOrdenInterna: string;
  folio: string;
  fecha: string;
  area: string;
  estado: string;
  empleadoEntrega: string;
  empleadoRecibe: string;
  idAlmacen: string;
  almacen: string;
  idInsumo: string;
  insumo: string;
  alias: string;
  unidadMedida: string;
  cantidad: number;
  comentarioPartida: string;
  comentarioOrden: string;
}

export interface TotalPorInsumo {
  insumo: string;
  unidadMedida: string;
  cantidad: number;
}

export interface SalidaMaterialResponse {
  filas: SalidaMaterial[];
  totalesPorInsumo: TotalPorInsumo[];
  totalFilas: number;
}

export interface Reporte {
  fechaInicio?: string;
  fechaFin?: string;
  areas?: string[];
  idEmpleados?: string[];
  idInsumos?: string[];
  idAlmacenes?: string[];
}

@Injectable({ providedIn: 'root' })
export class ReporteSalidaMaterialService {
  listAll = signal<SalidaMaterial[]>([]);

  constructor(private http: HttpClient) {}

  getAll(report: Reporte): Observable<SalidaMaterialResponse> {
    return this.http
      .post<SalidaMaterialResponse>('reportes/salida-material', report)
      .pipe(tap((resp) => this.listAll.set(resp.filas ?? [])));
  }
}
