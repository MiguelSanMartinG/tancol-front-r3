import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';

export type DashboardView = 'bars' | 'line' | 'area' | 'donut' | 'pie' | 'stacked' | 'radar' | 'table' | 'ranking';
export type RankingView = DashboardView;
export type SalesRhythmView = DashboardView;

export interface DashboardKpiConfig {
  inlineKpis: boolean;
  kpis: {
    unidadesVendidas: boolean;
    empleadosActivos: boolean;
    clientesAtendidos: boolean;
    diasOperacion: boolean;
    importeReportado: boolean;
    promedioDiario: boolean;
    promedioPorEmpleado: boolean;
    operaciones: boolean;
    ticketPromedio: boolean;
    descuentos: boolean;
    canceladas: boolean;
    facturadas: boolean;
    mejorDia: boolean;
    peorDia: boolean;
  };
  charts: {
    ritmoVentas: boolean;
    topEmpleados: boolean;
    topProductos: boolean;
    topClientes: boolean;
    metodosPago: boolean;
    ventasPorRuta: boolean;
    ventasPorConcepto: boolean;
  };
  official: {
    consumoClientesPorDia: boolean;
    topClientesPgExp: boolean;
    clientesMasEquipos: boolean;
    clientesSinConsumo: boolean;
    empleadosMetasCumplidas: boolean;
    topDepartamentosInsumos: boolean;
    topInsumosComprados: boolean;
    devolucionesEquipos: boolean;
    mayorMovimientoEquipos: boolean;
    menorMovimientoEquipos: boolean;
  };
  views: {
    ritmoVentas: SalesRhythmView;
    topEmpleados: RankingView;
    topProductos: RankingView;
    topClientes: RankingView;
    metodosPago: RankingView;
    ventasPorRuta: RankingView;
    ventasPorConcepto: RankingView;
    consumoClientesPorDia: SalesRhythmView;
    topClientesPgExp: RankingView;
    clientesMasEquipos: RankingView;
    clientesSinConsumo: RankingView;
    empleadosMetasCumplidas: DashboardView;
    topDepartamentosInsumos: RankingView;
    topInsumosComprados: RankingView;
  };
  colors: {
    unidadesVendidas: string;
    empleadosActivos: string;
    clientesAtendidos: string;
    diasOperacion: string;
    importeReportado: string;
    promedioDiario: string;
    promedioPorEmpleado: string;
    operaciones: string;
    ticketPromedio: string;
    descuentos: string;
    canceladas: string;
    facturadas: string;
    mejorDia: string;
    peorDia: string;
    devolucionesEquipos: string;
    mayorMovimientoEquipos: string;
    menorMovimientoEquipos: string;
  };
}

@Injectable({ providedIn: 'root' })
export class DashboardKpiConfigService {
  private readonly endpoint = 'dashboard/kpis/configuracion';

  constructor(private readonly http: HttpClient) {}

  private readonly defaults: DashboardKpiConfig = {
    inlineKpis: false,
    kpis: {
      unidadesVendidas: true, empleadosActivos: true, clientesAtendidos: true, diasOperacion: true,
      importeReportado: true, promedioDiario: true, promedioPorEmpleado: true, operaciones: true,
      ticketPromedio: true, descuentos: true, canceladas: true, facturadas: true, mejorDia: true, peorDia: true,
    },
    charts: {
      ritmoVentas: true, topEmpleados: true, topProductos: true, topClientes: true,
      metodosPago: true, ventasPorRuta: true, ventasPorConcepto: true,
    },
    views: {
      ritmoVentas: 'bars', topEmpleados: 'ranking', topProductos: 'ranking', topClientes: 'ranking',
      metodosPago: 'ranking', ventasPorRuta: 'ranking', ventasPorConcepto: 'ranking',
      consumoClientesPorDia: 'bars', topClientesPgExp: 'ranking', clientesMasEquipos: 'bars', clientesSinConsumo: 'ranking',
      empleadosMetasCumplidas: 'ranking',
      topDepartamentosInsumos: 'bars', topInsumosComprados: 'bars',
    },
    official: {
      consumoClientesPorDia: true,
      topClientesPgExp: true,
      clientesMasEquipos: true,
      clientesSinConsumo: true,
      empleadosMetasCumplidas: true,
      topDepartamentosInsumos: true,
      topInsumosComprados: true,
      devolucionesEquipos: true,
      mayorMovimientoEquipos: true,
      menorMovimientoEquipos: true,
    },
    colors: {
      unidadesVendidas: '#5856d6', empleadosActivos: '#0ea5e9', clientesAtendidos: '#14b8a6',
      diasOperacion: '#f59e0b', importeReportado: '#8b5cf6', promedioDiario: '#06b6d4',
      promedioPorEmpleado: '#6366f1', operaciones: '#64748b', ticketPromedio: '#10b981',
      descuentos: '#f97316', canceladas: '#ef4444', facturadas: '#22c55e', mejorDia: '#84cc16', peorDia: '#f43f5e',
      devolucionesEquipos: '#ef4444', mayorMovimientoEquipos: '#14b8a6', menorMovimientoEquipos: '#f59e0b',
    },
  };

  getDefaults(): DashboardKpiConfig {
    return this.clone(this.defaults);
  }

  getRemoteConfig(): Observable<DashboardKpiConfig> {
    return this.http.get<{ configuracion?: Partial<DashboardKpiConfig> | null } | null>(this.endpoint)
      .pipe(map((response) => this.merge(response?.configuracion ?? null)));
  }

  saveRemoteConfig(config: DashboardKpiConfig): Observable<DashboardKpiConfig> {
    const normalizedConfig = this.merge(config);
    return this.http.put<{ configuracion?: Partial<DashboardKpiConfig> | null } | null>(this.endpoint, {
      configuracion: normalizedConfig,
    }).pipe(map((response) => this.merge(response?.configuracion ?? normalizedConfig)));
  }

  private merge(saved: Partial<DashboardKpiConfig> | null): DashboardKpiConfig {
    const views = { ...this.defaults.views, ...(saved?.views ?? {}) };
    return {
      inlineKpis: saved?.inlineKpis ?? this.defaults.inlineKpis,
      kpis: { ...this.defaults.kpis, ...(saved?.kpis ?? {}) },
      charts: { ...this.defaults.charts, ...(saved?.charts ?? {}) },
      official: { ...this.defaults.official, ...(saved?.official ?? {}) },
      views,
      colors: { ...this.defaults.colors, ...(saved?.colors ?? {}) },
    };
  }

  private clone(config: DashboardKpiConfig): DashboardKpiConfig {
    return JSON.parse(JSON.stringify(config)) as DashboardKpiConfig;
  }
}
