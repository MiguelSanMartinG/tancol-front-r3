import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AppPrimengModule } from '@shared/app-primeng/app-primeng.module';
import { BotonRegresarComponent } from '@shared/components/boton-regresar/boton-regresar.component';
import { HeaderComponent } from '@shared/components/header/header.component';
import { ExcelExportService, ExportColumn } from '@shared/services/excel.export.service';
import { NuestrosProductosResponse } from '../../nuestros-productos/service/nuestros-productos.response';
import { NuestrosProductosService } from '../../nuestros-productos/service/nuestros-productos.service';
import { ReporteVentasEmpleadosMetasFila, ReporteVentasEmpleadosMetasService } from '../services/reporte-ventas-empleados-metas.service';

@Component({
  selector: 'app-reporte-ventas-empleados-metas',
  standalone: true,
  imports: [CommonModule, FormsModule, AppPrimengModule, BotonRegresarComponent, HeaderComponent],
  templateUrl: './principal.component.html',
  styleUrl: './principal.component.scss',
})
export class PrincipalComponent implements OnInit {
  private readonly productosApi = inject(NuestrosProductosService);
  private readonly reporteApi = inject(ReporteVentasEmpleadosMetasService);

  productos: NuestrosProductosResponse[] = [];
  productosSeleccionados: string[] = [];
  rangoSemana: Date[] = [];
  semanaEnHover: { inicio: string; fin: string } | null = null;
  filas: ReporteVentasEmpleadosMetasFila[] = [];
  cargando = false;
  error = '';
  busquedaRealizada = false;

  ngOnInit(): void {
    this.seleccionarSemana(new Date());
    this.productosApi.getAllFilter('?enabled=true').subscribe({
      next: (items) => this.productos = items.filter((item) => item.enabled),
      error: () => this.error = 'No se pudieron cargar los productos.',
    });
  }

  buscar(): void {
    this.error = '';
    const [inicio, fin] = this.rangoSemana;
    if (!inicio || !fin) {
      this.error = 'Selecciona una semana.';
      return;
    }
    if (!this.productosSeleccionados.length) {
      this.error = 'Selecciona al menos un producto.';
      return;
    }

    this.cargando = true;
    this.busquedaRealizada = true;
    this.reporteApi.consultar({
      fechaInicio: `${this.fechaLocal(inicio)}T00:00:00`,
      fechaFin: `${this.fechaLocal(this.addDays(fin, 1))}T00:00:00`,
      idProductos: this.productosSeleccionados,
    }).subscribe({
      next: (filas) => { this.filas = filas ?? []; this.cargando = false; },
      error: (err) => {
        this.error = err?.error?.message ?? 'No se pudo cargar el reporte.';
        this.filas = [];
        this.cargando = false;
      },
    });
  }

  limpiar(): void {
    this.seleccionarSemana(new Date());
    this.productosSeleccionados = [];
    this.filas = [];
    this.error = '';
    this.busquedaRealizada = false;
  }

  exportar(): void {
    if (!this.filas.length) return;
    const columns: ExportColumn[] = [
      { header: 'Empleado', key: 'empleadoNombre', width: 30 },
      { header: 'Producto', key: 'productoNombre', width: 24 },
      { header: 'Alias', key: 'productoAlias', width: 16 },
      { header: 'Venta mínima', key: 'ventaMinima', width: 16 },
      { header: 'Venta del periodo', key: 'ventaSemana', width: 18 },
      { header: 'Alcance', key: 'alcanceObjetivo', width: 14 },
      { header: 'Comisión sugerida', key: 'comisionSugerida', width: 20 },
    ];
    const filasExportacion = this.filas.map((fila) => ({
      ...fila,
      ventaMinima: fila.ventaMinima ?? 'NA',
      alcanceObjetivo: fila.alcanceObjetivo ?? 0,
      comisionSugerida: fila.comisionSugerida ?? 0,
    }));
    ExcelExportService.exportAsExcelFile(filasExportacion, columns, 'reporte-ventas-empleados-metas');
  }

  formatoCantidad(value: number | null): string {
    return value === null ? '' : new Intl.NumberFormat('es-MX', { maximumFractionDigits: 2 }).format(value);
  }

  formatoDinero(value: number | null): string {
    return value === null ? '' : new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(value);
  }

  seleccionarSemana(fecha: Date): void {
    if (!fecha) return;
    const inicio = new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate());
    inicio.setDate(inicio.getDate() - ((inicio.getDay() + 6) % 7));
    const fin = this.addDays(inicio, 6);
    this.rangoSemana = [inicio, fin];
  }

  previsualizarSemana(fecha: { year: number; month: number; day: number }): void {
    const dia = new Date(fecha.year, fecha.month, fecha.day);
    const inicio = new Date(dia.getFullYear(), dia.getMonth(), dia.getDate());
    inicio.setDate(inicio.getDate() - ((inicio.getDay() + 6) % 7));
    this.semanaEnHover = { inicio: this.fechaLocal(inicio), fin: this.fechaLocal(this.addDays(inicio, 6)) };
  }

  limpiarPrevisualizacion(): void {
    this.semanaEnHover = null;
  }

  fechaEnHover(fecha: { year: number; month: number; day: number }): boolean {
    if (!this.semanaEnHover) return false;
    const value = this.fechaLocal(new Date(fecha.year, fecha.month, fecha.day));
    return value >= this.semanaEnHover.inicio && value <= this.semanaEnHover.fin;
  }

  esInicioHover(fecha: { year: number; month: number; day: number }): boolean {
    return !!this.semanaEnHover && this.fechaLocal(new Date(fecha.year, fecha.month, fecha.day)) === this.semanaEnHover.inicio;
  }

  esFinHover(fecha: { year: number; month: number; day: number }): boolean {
    return !!this.semanaEnHover && this.fechaLocal(new Date(fecha.year, fecha.month, fecha.day)) === this.semanaEnHover.fin;
  }

  fechaEnSemanaSeleccionada(fecha: { year: number; month: number; day: number }): boolean {
    const [inicio, fin] = this.rangoSemana;
    if (!inicio || !fin) return false;
    const value = this.fechaLocal(new Date(fecha.year, fecha.month, fecha.day));
    return value >= this.fechaLocal(inicio) && value <= this.fechaLocal(fin);
  }

  esInicioSeleccionado(fecha: { year: number; month: number; day: number }): boolean {
    return !!this.rangoSemana[0] && this.fechaLocal(new Date(fecha.year, fecha.month, fecha.day)) === this.fechaLocal(this.rangoSemana[0]);
  }

  esFinSeleccionado(fecha: { year: number; month: number; day: number }): boolean {
    return !!this.rangoSemana[1] && this.fechaLocal(new Date(fecha.year, fecha.month, fecha.day)) === this.fechaLocal(this.rangoSemana[1]);
  }

  private fechaLocal(date: Date): string {
    const pad = (value: number) => String(value).padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  }

  private addDays(date: Date, days: number): Date {
    const result = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    result.setDate(result.getDate() + days);
    return result;
  }
}
