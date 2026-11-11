import { CommonModule } from '@angular/common';
import { AfterViewInit, ChangeDetectionStrategy, Component, ElementRef, OnChanges, OnDestroy, SimpleChanges, input, viewChild } from '@angular/core';
import * as echarts from 'echarts/core';
import { BarChart, LineChart, PieChart, RadarChart } from 'echarts/charts';
import { GridComponent, LegendComponent, RadarComponent, TooltipComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import { DashboardView } from '../../../services/dashboard-kpi-config.service';

echarts.use([BarChart, LineChart, PieChart, RadarChart, GridComponent, LegendComponent, RadarComponent, TooltipComponent, CanvasRenderer]);

@Component({
  selector: 'app-dashboard-chart',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div #chart class="dashboard-chart" [class.chart-hidden]="type() === 'table'" [class.chart-long-axis]="((type() === 'line' || type() === 'area' || type() === 'ranking') && labels().length > 6)"></div>
    <div *ngIf="type() === 'donut' || type() === 'pie'" class="chart-legend">
      <div *ngFor="let label of labels(); let i = index" class="chart-legend-item" [title]="label">
        <i [style.background]="legendColors[i % legendColors.length]"></i><span>{{ label }}</span><strong>{{ formatValue(values()[i] ?? 0) }}</strong>
      </div>
    </div>
    <div *ngIf="type() === 'table'" class="dashboard-table">
      <div class="dashboard-table-row dashboard-table-head"><span>Elemento</span><span>Valor</span></div>
      <div *ngFor="let label of labels(); let i = index" class="dashboard-table-row">
        <span>{{ label }}</span><strong>{{ formatValue(values()[i] ?? 0) }}</strong>
      </div>
    </div>
  `,
  styleUrl: './dashboard-chart.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardChartComponent implements AfterViewInit, OnChanges, OnDestroy {
  readonly legendColors = ['#5856d6', '#7c7ae8', '#22b8cf', '#f59e0b', '#f472b6'];
  type = input<DashboardView>('bars');
  labels = input<string[]>([]);
  values = input<number[]>([]);
  series = input<{ name: string; values: number[]; color?: string }[]>([]);
  color = input('#5856d6');
  currency = input(false);
  private readonly chartElement = viewChild.required<ElementRef<HTMLDivElement>>('chart');
  private chart?: echarts.ECharts;
  private resizeObserver?: ResizeObserver;

  ngAfterViewInit(): void {
    this.render();
    this.resizeObserver = new ResizeObserver(() => this.chart?.resize());
    this.resizeObserver.observe(this.chartElement().nativeElement);
  }
  ngOnChanges(_changes: SimpleChanges): void { this.render(); }
  ngOnDestroy(): void {
    this.resizeObserver?.disconnect();
    this.chart?.dispose();
  }

  formatValue(value: number): string {
    return this.currency() ? `$${new Intl.NumberFormat('es-MX').format(value)}` : new Intl.NumberFormat('es-MX').format(value);
  }

  private render(): void {
    if (!this.chartElement()) return;
    this.chart ??= echarts.init(this.chartElement().nativeElement);
    const labels = this.labels();
    const values = this.values();
    const comparisonSeries = this.series();
    const type = this.type();
    const color = this.color();
    const isPie = type === 'donut' || type === 'pie';
    const isRadar = type === 'radar';
    const isLine = type === 'line' || type === 'area';
    const isStacked = type === 'stacked';
    const isRanking = type === 'ranking';
    if (type === 'table') {
      this.chart?.clear();
      return;
    }
    const format = (value: number) => this.currency() ? `$${new Intl.NumberFormat('es-MX').format(value)}` : new Intl.NumberFormat('es-MX').format(value);

    const option: echarts.EChartsCoreOption = {
      animation: false,
      color: [color, '#7c7ae8', '#22b8cf', '#f59e0b', '#f472b6'],
      tooltip: { trigger: isPie ? 'item' : 'axis', valueFormatter: (value: number) => format(value) },
      grid: { left: 12, right: 18, top: comparisonSeries.length > 1 ? 42 : 18, bottom: labels.length > 6 && !isPie && !isRadar && !isRanking ? 58 : 28, containLabel: true },
      xAxis: isPie || isRadar ? undefined : isRanking
        ? { type: 'value', axisLabel: { color: '#94a3b8' }, splitLine: { lineStyle: { color: '#eef2f7' } } }
        : { type: 'category', data: labels, axisLabel: { color: '#94a3b8', interval: 0, rotate: labels.length > 6 ? 35 : 0, formatter: (value: string) => value.length > 20 ? `${value.slice(0, 20)}…` : value }, axisLine: { lineStyle: { color: '#e2e8f0' } } },
      yAxis: isPie || isRadar ? undefined : isRanking
        ? { type: 'category', data: labels, inverse: true, axisLabel: { color: '#64748b', width: 120, overflow: 'truncate' }, axisLine: { lineStyle: { color: '#e2e8f0' } } }
        : { type: 'value', axisLabel: { color: '#94a3b8' }, splitLine: { lineStyle: { color: '#eef2f7' } } },
      legend: comparisonSeries.length > 1 ? { top: 0, textStyle: { color: '#64748b', fontSize: 11 } } : undefined,
      series: isPie
        ? [{ type: 'pie', radius: type === 'donut' ? ['48%', '72%'] : '68%', center: ['50%', '46%'], data: labels.map((name, index) => ({ name, value: values[index] ?? 0 })), label: { show: true, formatter: '{b}: {c}', color: '#475569', fontSize: 11 } }]
        : isRadar
          ? [{ type: 'radar', data: [{ value: values, name: 'Total' }], areaStyle: { color }, lineStyle: { color }, itemStyle: { color }, label: { show: true, formatter: '{c}', color: '#475569', fontSize: 10 } }]
          : comparisonSeries.length > 1
            ? comparisonSeries.map((item) => ({
              name: item.name,
              type: isLine ? 'line' as const : 'bar' as const,
              data: item.values,
              smooth: isLine,
              areaStyle: type === 'area' ? { opacity: .18 } : undefined,
              itemStyle: { color: item.color, borderRadius: isLine ? 0 : isRanking ? [0, 5, 5, 0] : [5, 5, 0, 0] },
              lineStyle: { color: item.color, width: 2 },
              symbolSize: 6,
              barMaxWidth: 24,
              label: { show: isRanking && labels.length <= 12, position: isRanking ? 'right' : 'top', formatter: '{c}', color: '#64748b', fontSize: 10 },
            }))
            : [{ type: isLine ? 'line' : 'bar', data: values, smooth: isLine, stack: isStacked ? 'total' : undefined, areaStyle: type === 'area' ? { color, opacity: .22 } : undefined, itemStyle: { color, borderRadius: isLine ? 0 : isRanking ? [0, 5, 5, 0] : [5, 5, 0, 0] }, label: { show: isRanking || isRadar || isPie || (isLine && labels.length <= 12) || (type === 'bars' && values.length <= 12), position: isRanking ? 'right' : 'top', formatter: '{c}', color: '#64748b', fontSize: 11 } }],
    };
    if (isRadar) {
      option['radar'] = { indicator: labels.map((name) => ({ name, max: Math.max(...values, 1) * 1.15 })), center: ['50%', '48%'], radius: '62%', axisName: { color: '#64748b' }, splitLine: { lineStyle: { color: '#e2e8f0' } }, splitArea: { areaStyle: { color: ['#fff', '#f8fafc'] } } };
    }
    this.chart.setOption(option, true);
  }
}
