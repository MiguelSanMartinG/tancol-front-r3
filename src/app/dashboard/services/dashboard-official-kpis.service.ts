import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';

export interface OfficialKpiDailyItem {
  fecha: string;
  unidades: number;
  clientesAtendidos: number;
  importe: number;
}

export interface OfficialKpiRankingItem {
  idCliente: string;
  cliente: string;
  unidadesTotales?: number;
  equiposAsignados?: number;
  equiposActivos?: number;
  diasSinConsumir?: number;
}

export interface OfficialKpiDepartmentProduct {
  idProducto: string;
  producto: string;
  cantidad: number;
  unidad: string;
}

export interface OfficialKpiDepartmentItem {
  departamento?: string;
  uso?: string;
  cantidadTotal: number;
  productos: OfficialKpiDepartmentProduct[];
}

export interface OfficialKpiPurchasedItem {
  idProducto: string;
  producto: string;
  cantidad: number;
  unidad: string;
}

export interface EmpleadoMetaCumplida {
  metaId: string;
  empleadoId: string;
  empleadoNombre: string;
  productoId: string;
  productoNombre: string;
  productoAlias: string | null;
  cantidadMinima: number;
  cantidadVendida: number;
  cubierto: true;
  periodoInicio: string;
  periodoFin: string;
}

export interface EmpleadosMetasCumplidasResponse {
  periodoInicio: string;
  periodoFin: string;
  total: number;
  cumplidas: EmpleadoMetaCumplida[];
}

export interface OfficialKpiResponse {
  consumoClientesPorDia: OfficialKpiDailyItem[];
  topClientesPgExp: OfficialKpiRankingItem[];
  clientesConMasEquipos: OfficialKpiRankingItem[];
  clientesSinConsumo: OfficialKpiRankingItem[];
  devolucionesEquipos: { totalDevoluciones: number };
  diaMayorMovimiento: { fecha: string; movimientos: number } | null;
  diaMenorMovimiento: { fecha: string; movimientos: number } | null;
  topDepartamentosInsumos?: OfficialKpiDepartmentItem[];
  topInsumosComprados?: OfficialKpiPurchasedItem[];
}

@Injectable({ providedIn: 'root' })
export class DashboardOfficialKpisService {
  constructor(private http: HttpClient) {}

  getOfficial(fechaInicio: string, fechaFin: string, limit = 10): Observable<OfficialKpiResponse> {
    if (!this.isDate(fechaInicio) || !this.isDate(fechaFin) || fechaInicio > fechaFin) {
      return throwError(() => new Error('El periodo debe incluir fechas válidas y fechaInicio no puede ser posterior a fechaFin.'));
    }
    if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
      return throwError(() => new Error('limit debe ser un entero entre 1 y 100.'));
    }
    const params = new HttpParams()
      .set('fechaInicio', fechaInicio)
      .set('fechaFin', fechaFin)
      .set('limit', limit);
    return this.http.get<OfficialKpiResponse>('dashboard/kpis/official', { params });
  }

  getEmpleadosMetasCumplidas(): Observable<EmpleadosMetasCumplidasResponse> {
    return this.http.get<EmpleadosMetasCumplidasResponse>('dashboard/kpis/metas-empleados-cumplidas');
  }

  private isDate(value: string): boolean {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
    const date = new Date(`${value}T00:00:00Z`);
    return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
  }
}
