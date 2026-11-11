import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AppPrimengModule } from '@shared/app-primeng/app-primeng.module';
import { AppSharedModule } from '@shared/app-shared.module';
import { BotonRegresarComponent } from '@shared/components/boton-regresar/boton-regresar.component';
import { HeaderComponent } from '@shared/components/header/header.component';
import { DateUtilService } from '@shared/services/date-util.service';
import { DashboardKpiConfig, DashboardKpiConfigService } from '../../../services/dashboard-kpi-config.service';
import { catchError, forkJoin, of } from 'rxjs';
import {
  ReporteGeneralCorridasResponse,
  ReporteGeneralService,
  ReporteGeneralTipo,
} from '../../reporte-general/services/reporte-general.service';
import {
  ReporteVolumenVentasEmpleadoDiaService,
  VolumenVentasEmpleadoDiaItem,
} from '../../reporte-volumen-ventas-empleado-dia/services/reporte-volumen-ventas-empleado-dia.service';
import {
  ReporteVolumenVentasClienteService,
  VolumenVentasClienteItem,
} from '../../reporte-volumen-ventas-cliente/services/reporte-volumen-ventas-cliente.service';
import { ReporteCuentasItem, ReporteCuentasService } from '../../reporte-cuentas/services/reporte-cuentas.service';
import { DashboardChartComponent } from '../components/dashboard-chart.component';
import { DashboardOfficialKpisService, EmpleadoMetaCumplida, EmpleadosMetasCumplidasResponse, OfficialKpiDepartmentItem, OfficialKpiPurchasedItem, OfficialKpiResponse } from '../../../services/dashboard-official-kpis.service';

interface RankingItem {
  label: string;
  value: number;
  percent: number;
}

interface DailyItem {
  label: string;
  value: number;
  percent: number;
}

@Component({
  selector: 'app-dashboard-reportes',
  standalone: true,
  imports: [CommonModule, FormsModule, AppPrimengModule, AppSharedModule, BotonRegresarComponent, HeaderComponent, DashboardChartComponent],
  templateUrl: './principal.component.html',
  styleUrl: './principal.component.scss',
})
export class PrincipalComponent implements OnInit {
  private readonly dateUtil = inject(DateUtilService);
  private readonly ventasDiaApi = inject(ReporteVolumenVentasEmpleadoDiaService);
  private readonly ventasClienteApi = inject(ReporteVolumenVentasClienteService);
  private readonly reporteGeneralApi = inject(ReporteGeneralService);
  private readonly configService = inject(DashboardKpiConfigService);
  private readonly cuentasApi = inject(ReporteCuentasService);
  private readonly officialKpisApi = inject(DashboardOfficialKpisService);

  config: DashboardKpiConfig = this.configService.getDefaults();
  monthValue = this.toMonthValue(new Date());
  monthLabel = '';
  loading = false;
  loadingConfig = true;
  configError = false;
  error = false;

  totalUnidades = 0;
  unidadesMesAnterior = 0;
  empleadosActivos = 0;
  clientesActivos = 0;
  diasConVenta = 0;
  importeReportado = 0;
  daily: DailyItem[] = [];
  topEmployees: RankingItem[] = [];
  topProducts: RankingItem[] = [];
  topClients: RankingItem[] = [];
  paymentRanking: RankingItem[] = [];
  routeRanking: RankingItem[] = [];
  conceptRanking: RankingItem[] = [];
  promedioDiario = 0;
  promedioPorEmpleado = 0;
  operaciones = 0;
  ticketPromedio = 0;
  descuentos = 0;
  canceladas = 0;
  facturadas = 0;
  mejorDia = '--';
  peorDia = '--';
  consumoClientesPorDia: DailyItem[] = [];
  topClientesPgExp: RankingItem[] = [];
  clientesMasEquipos: RankingItem[] = [];
  clientesSinConsumo: RankingItem[] = [];
  topDepartamentosInsumos: OfficialKpiDepartmentItem[] = [];
  topInsumosComprados: OfficialKpiPurchasedItem[] = [];
  empleadosMetasCumplidas: EmpleadoMetaCumplida[] = [];
  periodoMetasInicio = '';
  periodoMetasFin = '';
  totalMetasCumplidas = 0;
  errorMetasEmpleadosCumplidas = false;
  goalChartLabels: string[] = [];
  goalChartSeries: { name: string; values: number[]; color: string }[] = [];
  devolucionesEquipos = 0;
  mayorMovimientoEquipos = '--';
  menorMovimientoEquipos = '--';

  private readonly generalTypes: ReporteGeneralTipo[] = [
    'rg-credito',
    'rg-factura',
    'rg-nofactura',
    'rp-tcredito',
    'rp-tdebito',
  ];

  ngOnInit(): void {
    this.configService.getRemoteConfig().subscribe({
      next: (config) => {
        this.config = config;
        this.loadingConfig = false;
        this.loadDashboard();
      },
      error: () => {
        this.config = this.configService.getDefaults();
        this.configError = true;
        this.loadingConfig = false;
        this.loadDashboard();
      },
    });
  }

  loadDashboard(): void {
    this.loading = true;
    this.error = false;
    this.monthLabel = this.formatMonthLabel(this.monthValue);

    const current = this.getRange(this.monthValue);
    const previous = this.getRange(this.shiftMonth(this.monthValue, -1));

    forkJoin({
      currentEmployees: this.ventasDiaApi.getReporte({
        ...current,
        idEmpledos: [],
        idProductos: [],
      }).pipe(),
      previousEmployees: this.ventasDiaApi.getReporte({
        ...previous,
        idEmpledos: [],
        idProductos: [],
      }).pipe(),
      clients: this.ventasClienteApi.getReporte({
        ...current,
        idCliente: [],
        idProductosComerciales: [],
      }),
      general: forkJoin(
        this.generalTypes.map((type) =>
          this.reporteGeneralApi.getReporte(type, current)
        )
      ),
      cuentas: this.cuentasApi.getReport({
        cancelado: false,
        conceptosVenta: [],
        descuento: false,
        f1: false,
        facturado: false,
        ...current,
        idClientes: [],
        idProductosComerciales: [],
        idRutas: [],
        tipoPago: [],
        x: 'dashboard',
      }).pipe(catchError(() => of([] as ReporteCuentasItem[]))),
      official: this.officialKpisApi.getOfficial(current.fechaInicio.slice(0, 10), current.fechaFin.slice(0, 10))
        .pipe(catchError(() => of(this.emptyOfficialKpis()))),
      empleadosMetas: this.config.official.empleadosMetasCumplidas
        ? this.officialKpisApi.getEmpleadosMetasCumplidas().pipe(catchError(() => of(null)))
        : of(this.emptyEmpleadosMetasCumplidas()),
    }).subscribe({
      next: ({ currentEmployees, previousEmployees, clients, general, cuentas, official, empleadosMetas }) => {
        this.buildMetrics(
          currentEmployees ?? [], previousEmployees ?? [], clients ?? [], general ?? [],
          cuentas ?? []
        );
        this.buildOfficialMetrics(official);
        this.buildEmpleadosMetas(empleadosMetas);
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.error = true;
      },
    });
  }

  private buildOfficialMetrics(response: OfficialKpiResponse): void {
    this.consumoClientesPorDia = this.toOfficialDaily(response.consumoClientesPorDia ?? []);
    this.topClientesPgExp = this.toOfficialRanking(response.topClientesPgExp ?? [], (item) => item.unidadesTotales ?? 0);
    this.clientesMasEquipos = this.toOfficialRanking(response.clientesConMasEquipos ?? [], (item) => item.equiposAsignados ?? item.equiposActivos ?? 0);
    this.clientesSinConsumo = this.toOfficialRanking(response.clientesSinConsumo ?? [], (item) => item.diasSinConsumir ?? 0);
    this.topDepartamentosInsumos = (response.topDepartamentosInsumos ?? [])
      .slice(0, 3)
      .map((departamento) => ({ ...departamento, productos: (departamento.productos ?? []).slice(0, 3) }));
    this.topInsumosComprados = response.topInsumosComprados ?? [];
    this.devolucionesEquipos = Number(response.devolucionesEquipos?.totalDevoluciones ?? 0);
    this.mayorMovimientoEquipos = response.diaMayorMovimiento?.fecha ? this.formatOfficialDay(response.diaMayorMovimiento.fecha) : '--';
    this.menorMovimientoEquipos = response.diaMenorMovimiento?.fecha ? this.formatOfficialDay(response.diaMenorMovimiento.fecha) : '--';
  }

  private emptyOfficialKpis(): OfficialKpiResponse {
    return {
      consumoClientesPorDia: [],
      topClientesPgExp: [],
      clientesConMasEquipos: [],
      clientesSinConsumo: [],
      topDepartamentosInsumos: [],
      topInsumosComprados: [],
      devolucionesEquipos: { totalDevoluciones: 0 },
      diaMayorMovimiento: null,
      diaMenorMovimiento: null,
    };
  }

  private emptyEmpleadosMetasCumplidas(): EmpleadosMetasCumplidasResponse {
    return { periodoInicio: '', periodoFin: '', total: 0, cumplidas: [] };
  }

  private buildEmpleadosMetas(response: EmpleadosMetasCumplidasResponse | null): void {
    this.errorMetasEmpleadosCumplidas = response === null;
    this.empleadosMetasCumplidas = response?.cumplidas ?? [];
    this.periodoMetasInicio = response?.periodoInicio ?? '';
    this.periodoMetasFin = response?.periodoFin ?? '';
    this.totalMetasCumplidas = Number(response?.total) || 0;
    this.goalChartLabels = this.empleadosMetasCumplidas.map((item) => `${item.empleadoNombre} · ${item.productoNombre}${item.productoAlias ? ` (${item.productoAlias})` : ''}`);
    this.goalChartSeries = [
      { name: 'Meta', values: this.empleadosMetasCumplidas.map((item) => Number(item.cantidadMinima) || 0), color: '#8b5cf6' },
      { name: 'Vendido', values: this.empleadosMetasCumplidas.map((item) => Number(item.cantidadVendida) || 0), color: '#0ea5a4' },
    ];
  }

  formatGoalQuantity(value: number): string {
    return new Intl.NumberFormat('es-MX', { maximumFractionDigits: 2 }).format(Number(value) || 0);
  }

  formatGoalPeriod(value: string): string {
    if (!value) return '';
    const date = new Date(`${value.slice(0, 10)}T12:00:00`);
    return new Intl.DateTimeFormat('es-MX', { weekday: 'short', day: '2-digit', month: 'short' }).format(date);
  }

  private toOfficialDaily(items: OfficialKpiResponse['consumoClientesPorDia']): DailyItem[] {
    const max = Math.max(...items.map((item) => Number(item.unidades) || 0), 1);
    return items.map((item) => ({ label: item.fecha.slice(8, 10), value: Number(item.unidades) || 0, percent: ((Number(item.unidades) || 0) / max) * 100 }));
  }

  private toOfficialRanking(items: OfficialKpiResponse['topClientesPgExp'], getValue: (item: OfficialKpiResponse['topClientesPgExp'][number]) => number): RankingItem[] {
    const values = items.map((item) => ({ label: item.cliente || 'Sin cliente', value: Number(getValue(item)) || 0 }));
    const max = Math.max(...values.map((item) => item.value), 1);
    return values.map((item) => ({ ...item, percent: (item.value / max) * 100 }));
  }

  private formatOfficialDay(value: string): string {
    return `${value.slice(8, 10)} ${new Intl.DateTimeFormat('es-MX', { month: 'short' }).format(new Date(`${value.slice(0, 10)}T12:00:00`))}`;
  }

  private buildMetrics(
    current: VolumenVentasEmpleadoDiaItem[],
    previous: VolumenVentasEmpleadoDiaItem[],
    clients: VolumenVentasClienteItem[],
    general: ReporteGeneralCorridasResponse[],
    cuentas: ReporteCuentasItem[]
  ): void {
    this.totalUnidades = this.sum(current.map((item) => item.cantidadVendida));
    this.unidadesMesAnterior = this.sum(previous.map((item) => item.cantidadVendida));
    this.empleadosActivos = new Set(current.map((item) => String(item.idEmpleado))).size;
    this.clientesActivos = new Set(
      clients.map((item) => String(item.idCliente ?? item.nombreComercial ?? item.nombre ?? ''))
        .filter(Boolean)
    ).size;
    this.importeReportado = this.sum(general.map((item) => item?.granTotal ?? 0));
    this.daily = this.toDaily(current);
    this.topEmployees = this.toRanking(current, (item) => item.nombre || 'Sin nombre');
    this.topProducts = this.toRanking(current, (item) => item.producto || 'Sin producto');
    this.topClients = this.toRanking(clients, (item) =>
      item.nombreComercial || item.nombre || item.razonSocial || 'Sin cliente'
    );
    this.diasConVenta = this.daily.length;
    const sortedDays = [...this.daily].sort((a, b) => b.value - a.value);
    this.mejorDia = sortedDays[0]?.label ?? '--';
    this.peorDia = sortedDays.at(-1)?.label ?? '--';
    this.promedioDiario = this.diasConVenta ? this.totalUnidades / this.diasConVenta : 0;
    this.promedioPorEmpleado = this.empleadosActivos ? this.totalUnidades / this.empleadosActivos : 0;
    this.operaciones = cuentas.length;
    this.ticketPromedio = this.operaciones ? this.sum(cuentas.map((item) => item.importe)) / this.operaciones : 0;
    this.descuentos = this.sum(cuentas.map((item) => item.descuentoEfectuado));
    this.canceladas = cuentas.filter((item) => item.cancelados).length;
    this.facturadas = cuentas.filter((item) => item.facturados).length;
    this.paymentRanking = this.toRanking(cuentas, (item) => item.tipoPago || 'Sin método', (item) => item.importe);
    this.routeRanking = this.toRanking(cuentas, (item) => item.nombreRuta || 'Sin ruta', (item) => item.importe);
    this.conceptRanking = this.toRanking(cuentas, (item) => item.conceptoVenta || 'Sin concepto', (item) => item.importe);
  }

  private toDaily(items: VolumenVentasEmpleadoDiaItem[]): DailyItem[] {
    const grouped = new Map<string, number>();
    items.forEach((item) => {
      const date = String(item.fecha ?? '').slice(0, 10);
      grouped.set(date, (grouped.get(date) ?? 0) + Number(item.cantidadVendida ?? 0));
    });

    const values = [...grouped.entries()].sort(([a], [b]) => a.localeCompare(b));
    const max = Math.max(...values.map(([, value]) => value), 1);
    return values.map(([date, value]) => ({
      label: date ? date.slice(8, 10) : '--',
      value,
      percent: (value / max) * 100,
    }));
  }

  private toRanking<T>(items: T[], getLabel: (item: T) => string, getValue?: (item: T) => number): RankingItem[] {
    const grouped = new Map<string, number>();
    items.forEach((item) => {
      const label = getLabel(item);
      const value = Number(getValue?.(item) ?? (item as any).cantidadVendida ?? 0);
      grouped.set(label, (grouped.get(label) ?? 0) + value);
    });
    const values = [...grouped.entries()].sort(([, a], [, b]) => b - a).slice(0, 5);
    const max = Math.max(...values.map(([, value]) => value), 1);
    return values.map(([label, value]) => ({ label, value, percent: (value / max) * 100 }));
  }

  monthChanged(): void {
    if (this.monthValue) this.loadDashboard();
  }

  previousMonth(): void {
    this.monthValue = this.shiftMonth(this.monthValue, -1);
    this.loadDashboard();
  }

  nextMonth(): void {
    this.monthValue = this.shiftMonth(this.monthValue, 1);
    this.loadDashboard();
  }

  changePercent(): number {
    if (!this.unidadesMesAnterior) return this.totalUnidades ? 100 : 0;
    return ((this.totalUnidades - this.unidadesMesAnterior) / this.unidadesMesAnterior) * 100;
  }

  formatNumber(value: number): string {
    return new Intl.NumberFormat('es-MX', { maximumFractionDigits: 0 }).format(value);
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      maximumFractionDigits: 0,
    }).format(value);
  }

  itemLabels(items: RankingItem[]): string[] { return items.map((item) => item.label); }
  itemValues(items: RankingItem[]): number[] { return items.map((item) => item.value); }
  purchasedLabels(items: OfficialKpiPurchasedItem[]): string[] { return items.map((item) => `${item.producto} (${item.unidad})`); }
  purchasedValues(items: OfficialKpiPurchasedItem[]): number[] { return items.map((item) => Number(item.cantidad) || 0); }
  get dailyLabels(): string[] { return this.daily.map((item) => item.label); }
  get dailyValues(): number[] { return this.daily.map((item) => item.value); }
  dailyLabelsFor(items: DailyItem[]): string[] { return items.map((item) => item.label); }
  dailyValuesFor(items: DailyItem[]): number[] { return items.map((item) => item.value); }

  donutStyle(items: RankingItem[]): string {
    const total = items.reduce((sum, item) => sum + item.value, 0);
    if (!total) return 'conic-gradient(#e2e8f0 0 100%)';
    let start = 0;
    const colors = ['#5856d6', '#7c7ae8', '#22b8cf', '#f59e0b', '#f472b6'];
    const stops = items.map((item, index) => {
      const end = start + (item.value / total) * 100;
      const stop = `${colors[index % colors.length]} ${start}% ${end}%`;
      start = end;
      return stop;
    });
    return `conic-gradient(${stops.join(', ')})`;
  }

  dailyPoints(): string {
    if (!this.daily.length) return '';
    return this.daily.map((item, index) => {
      const x = this.daily.length === 1 ? 50 : (index / (this.daily.length - 1)) * 100;
      return `${x},${100 - item.percent}`;
    }).join(' ');
  }

  private getRange(month: string): { fechaInicio: string; fechaFin: string } {
    const [year, monthNumber] = month.split('-').map(Number);
    const start = new Date(year, monthNumber - 1, 1);
    const end = new Date(year, monthNumber, 0);
    return {
      fechaInicio: this.dateUtil.toUTCStartOfDay(start),
      fechaFin: this.dateUtil.toUTCEndOfDay(end),
    };
  }

  private shiftMonth(month: string, offset: number): string {
    const [year, monthNumber] = month.split('-').map(Number);
    return this.toMonthValue(new Date(year, monthNumber - 1 + offset, 1));
  }

  private toMonthValue(date: Date): string {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
  }

  private formatMonthLabel(month: string): string {
    const [year, monthNumber] = month.split('-').map(Number);
    return new Intl.DateTimeFormat('es-MX', { month: 'long', year: 'numeric' })
      .format(new Date(year, monthNumber - 1, 1));
  }

  private sum(values: number[]): number {
    return values.reduce((total, value) => total + (Number(value) || 0), 0);
  }
}
