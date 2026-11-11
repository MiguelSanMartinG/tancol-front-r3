import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { AppPrimengModule } from '@shared/app-primeng/app-primeng.module';
import { AppSharedModule } from '@shared/app-shared.module';
import { BotonRegresarComponent } from '@shared/components/boton-regresar/boton-regresar.component';
import { HeaderComponent } from '@shared/components/header/header.component';
import { DateUtilService } from '@shared/services/date-util.service';
import { EmpleadoApiService } from '../../empleados/services/empleado.api.service';
import { getEmpleadoNombreCompleto } from '../../empleados/services/dtos/empleado.response';
import { RutasApiService } from '../../rutas/services/rutas-api.service';
import { NuestrosProductosService } from '../../nuestros-productos/service/nuestros-productos.service';
import { ExcelExportService, ExportColumn } from '@shared/services/excel.export.service';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import {
  ReporteBitacoraTripulacionItem,
  ReporteBitacoraVentasService,
} from '../../reporte-bitacora-ventas/services/reporte-bitacora-ventas.service';

interface Option {
  label: string;
  value: string;
}

interface SemanaOption extends Option {
  inicio: Date;
  fin: Date;
}

interface VentaSemanalChofer {
  idEmpleado: string;
  nombre: string;
  ruta: string;
  producto: string;
  cantidadVendida: number;
  importe: number;
}

interface DiaMatriz {
  key: string;
  label: string;
  abreviatura: string;
  fecha: string;
}

interface CeldaTripulacion {
  chofer: string;
  ayudantes: string;
}

interface FilaRuta {
  ruta: string;
  celdas: Record<string, CeldaTripulacion[]>;
  ventasPorDia: Record<string, { cantidad: number; importe: number }>;
}

interface MatrizSemana {
  label: string;
  dias: DiaMatriz[];
  filas: FilaRuta[];
}

@Component({
  selector: 'app-reporte-ventas-semanal-chofer',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, AppPrimengModule, AppSharedModule, BotonRegresarComponent, HeaderComponent],
  templateUrl: './principal.component.html',
  styleUrl: './principal.component.scss',
})
export class PrincipalComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly dateUtil = inject(DateUtilService);
  private readonly bitacorasApi = inject(ReporteBitacoraVentasService);
  private readonly empleadosApi = inject(EmpleadoApiService);
  private readonly rutasApi = inject(RutasApiService);
  private readonly productosApi = inject(NuestrosProductosService);

  readonly years: Option[] = [];
  readonly meses: Option[] = Array.from({ length: 12 }, (_, index) => ({
    label: new Intl.DateTimeFormat('es-MX', { month: 'long' }).format(new Date(2020, index, 1)),
    value: String(index + 1),
  }));
  semanas: SemanaOption[] = [];
  listaEmpleados: Option[] = [];
  listaRutas: Option[] = [];
  preciosProductos = new Map<string, number>();
  registros: VentaSemanalChofer[] = [];
  matrices: MatrizSemana[] = [];
  loading = false;

  filtro = this.fb.group({
    año: [[String(new Date().getFullYear())]],
    mes: [[String(new Date().getMonth() + 1)]],
    semana: [[] as string[]],
    empleados: [[] as string[]],
    rutas: [[] as string[]],
  });

  ngOnInit(): void {
    const today = new Date();
    for (let year = today.getFullYear() - 5; year <= today.getFullYear() + 1; year++) {
      this.years.push({ label: String(year), value: String(year) });
    }

    forkJoin({
      empleados: this.empleadosApi.getAllFilter('?enabled=true'),
      rutas: this.rutasApi.getAllFilter('?enabled=true'),
      productos: this.productosApi.getAllFilter('?enabled=true'),
    }).subscribe(({ empleados, rutas, productos }) => {
      this.listaEmpleados = empleados.map((item) => ({ label: getEmpleadoNombreCompleto(item), value: item.idEmpleado }));
      this.listaRutas = rutas.map((item) => ({ label: item.nombre, value: item.id }));
      this.preciosProductos = new Map<string, number>(productos.map((item) => [this.normalize(item.alias), Number(item.precio) || 0]));
      this.buscar();
    });

    this.actualizarSemanas(this.filtro.value.año ?? [], this.filtro.value.mes ?? [], this.weekStart(today));
  }

  actualizarSemanas(years: string[], months: string[], preferredStart?: Date): void {
    const options: SemanaOption[] = [];
    for (const year of years) {
      for (const month of months) {
        const first = new Date(Number(year), Number(month) - 1, 1);
        const last = new Date(Number(year), Number(month), 0);
        let start = this.weekStart(first);
        while (start <= last) {
          const end = new Date(start);
          end.setDate(start.getDate() + 6);
          if (!options.some((option) => this.isoDate(option.inicio) === this.isoDate(start))) {
            options.push({ label: `${this.formatDate(start)} al ${this.formatDate(end)}`, value: this.isoDate(start), inicio: new Date(start), fin: end });
          }
          start = new Date(start);
          start.setDate(start.getDate() + 7);
        }
      }
    }
    options.sort((a, b) => a.inicio.getTime() - b.inicio.getTime());
    this.semanas = options;
    const selected = this.filtro.value.semana?.filter((value) => options.some((option) => option.value === value)) ?? [];
    const defaultWeek = options.find((option) => preferredStart && this.isoDate(option.inicio) === this.isoDate(preferredStart)) ?? options[0];
    this.filtro.patchValue({ semana: selected.length ? selected : defaultWeek ? [defaultWeek.value] : [] }, { emitEvent: false });
  }

  cambioPeriodo(): void {
    this.actualizarSemanas(this.filtro.value.año ?? [], this.filtro.value.mes ?? []);
  }

  buscar(): void {
    const semanas = this.semanas.filter((item) => this.filtro.value.semana?.includes(item.value));
    if (!semanas.length) return;
    this.loading = true;
    forkJoin(semanas.map((semana) => {
      const fechaInicio = this.dateUtil.toUTCStartOfDay(semana.inicio);
      const fechaFin = this.dateUtil.toUTCEndOfDay(semana.fin);
      return this.bitacorasApi.getTripulaciones({
          fechaInicio,
          fechaFin,
          idRutas: this.filtro.value.rutas ?? [],
          idChoferes: [],
          idAyudantes: [],
          idProductos: [],
          idVehiculos: [],
          procesos: [],
          rotos: false,
          fueraEspecificacion: false,
        }).pipe(catchError(() => of([] as ReporteBitacoraTripulacionItem[])));
    })).subscribe({
      next: (responses) => {
        this.registros = this.toRows(responses.flat());
        this.matrices = responses.map((response, index) => this.toMatrix(semanas[index], response));
        this.loading = false;
      },
      error: () => { this.registros = []; this.matrices = []; this.loading = false; },
    });
  }

  limpiar(): void {
    const today = new Date();
    this.filtro.patchValue({ año: [String(today.getFullYear())], mes: [String(today.getMonth() + 1)], empleados: [], rutas: [] });
    this.actualizarSemanas([String(today.getFullYear())], [String(today.getMonth() + 1)], this.weekStart(today));
    this.buscar();
  }

  totalUnidades(): number { return this.registros.reduce((total, item) => total + Number(item.cantidadVendida || 0), 0); }
  totalImporte(): number { return this.registros.reduce((total, item) => total + Number(item.importe || 0), 0); }
  totalChoferes(): number { return new Set(this.registros.map((item) => this.normalize(item.nombre))).size; }
  totalProductos(): number { return new Set(this.registros.map((item) => item.producto)).size; }

  exportar(): void {
    const columns: ExportColumn[] = [
      { header: 'Semana', key: 'semana', width: 24 },
      { header: 'Ruta', key: 'ruta', width: 24 },
      ...['Viernes', 'Sábado', 'Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves'].map((day) => ({ header: day, key: day, width: 32 })),
    ];
    const rows = this.matrices.flatMap((week) => week.filas.map((row) => ({
      semana: week.label,
      ruta: row.ruta,
      ...Object.fromEntries(week.dias.map((day) => {
        const crew = (row.celdas[day.key] ?? []).map((item) => `Chofer: ${item.chofer}\nAyudante: ${item.ayudantes || '—'}`);
        const sales = row.ventasPorDia[day.key];
        if (sales?.cantidad) crew.push(`Ventas: ${this.formatNumber(sales.cantidad)} u. · ${this.formatCurrency(sales.importe)}`);
        return [day.label, crew.join('\n') || '—'];
      })),
    })));
    if (rows.length) ExcelExportService.exportAsExcelFile(rows, columns, 'reporte-ventas-semanal-por-chofer');
  }

  formatNumber(value: number): string { return new Intl.NumberFormat('es-MX', { maximumFractionDigits: 2 }).format(value); }
  formatCurrency(value: number): string { return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(value); }

  private toMatrix(week: SemanaOption, crew: ReporteBitacoraTripulacionItem[]): MatrizSemana {
    const offsets = [0, 1, 2, 3, 4, 5, 6];
    const labels = ['Viernes', 'Sábado', 'Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves'];
    const abbreviations = ['V', 'S', 'D', 'L', 'M', 'M', 'J'];
    const dias = offsets.map((offset, index) => {
      const date = new Date(week.inicio);
      date.setDate(date.getDate() + offset);
      return {
        key: this.isoDate(date),
        label: labels[index],
        abreviatura: abbreviations[index],
        fecha: date.toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit' }),
      };
    });
    const routes = this.listaRutas.filter((route) => !this.filtro.value.rutas?.length || this.filtro.value.rutas.includes(route.value));
    const rows = new Map(routes.map((route) => [this.normalize(route.label), { ruta: route.label, celdas: {} as Record<string, CeldaTripulacion[]>, ventasPorDia: {} as Record<string, { cantidad: number; importe: number }> }]));
    const selectedNames = this.listaEmpleados
      .filter((employee) => this.filtro.value.empleados?.includes(employee.value))
      .map((employee) => this.normalize(employee.label));

    crew.forEach((item) => {
      const route = item.nombreRuta || 'Sin ruta';
      const routeKey = this.normalize(route);
      const dayKey = String(item.fecha ?? '').slice(0, 10);
      const chofer = item.chofer || '';
      const ayudantes = item.ayudantes || '';
      if (!dias.some((day) => day.key === dayKey)) return;
      if (selectedNames.length && !selectedNames.some((name) => this.normalize(chofer).includes(name) || this.normalize(ayudantes).includes(name))) return;

      const row = rows.get(routeKey) ?? { ruta: route, celdas: {} as Record<string, CeldaTripulacion[]>, ventasPorDia: {} as Record<string, { cantidad: number; importe: number }> };
      const cells = row.celdas[dayKey] ?? [];
      if (!cells.some((cell) => this.normalize(cell.chofer) === this.normalize(chofer) && this.normalize(cell.ayudantes) === this.normalize(ayudantes))) {
        cells.push({ chofer, ayudantes });
      }
      row.celdas[dayKey] = cells;
      const venta = row.ventasPorDia[dayKey] ?? { cantidad: 0, importe: 0 };
      const cantidadVendida = Number(item.cantidadVendida) || 0;
      venta.cantidad += cantidadVendida;
      venta.importe += cantidadVendida * (this.preciosProductos.get(this.normalize(item.nombreProducto)) ?? 0);
      row.ventasPorDia[dayKey] = venta;
      rows.set(routeKey, row);
    });

    return { label: week.label, dias, filas: [...rows.values()].sort((a, b) => a.ruta.localeCompare(b.ruta)) };
  }

  private toRows(sales: ReporteBitacoraTripulacionItem[]): VentaSemanalChofer[] {
    const rows = new Map<string, VentaSemanalChofer>();
    const selectedNames = this.listaEmpleados
      .filter((employee) => this.filtro.value.empleados?.includes(employee.value))
      .map((employee) => this.normalize(employee.label));

    sales.forEach((sale) => {
      const nombre = sale.chofer ?? 'Sin chofer';
      const ruta = sale.nombreRuta ?? 'Sin ruta';
      const producto = sale.nombreProducto ?? 'Sin producto';
      if (selectedNames.length && !selectedNames.some((name) => this.normalize(nombre).includes(name) || this.normalize(sale.ayudantes).includes(name))) return;
      const cantidadVendida = Number(sale.cantidadVendida) || 0;
      if (cantidadVendida <= 0) return;
      const key = `${this.normalize(nombre)}|${this.normalize(ruta)}|${this.normalize(producto)}`;
      const row = rows.get(key) ?? { idEmpleado: '', nombre, ruta, producto, cantidadVendida: 0, importe: 0 };
      row.cantidadVendida += cantidadVendida;
      row.importe += cantidadVendida * (this.preciosProductos.get(this.normalize(producto)) ?? 0);
      rows.set(key, row);
    });

    return [...rows.values()];
  }

  private normalize(value: string | null | undefined): string {
    return (value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLocaleLowerCase('es-MX');
  }

  private weekStart(date: Date): Date {
    const result = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    result.setDate(result.getDate() - ((result.getDay() + 2) % 7));
    return result;
  }

  private formatDate(date: Date): string { return date.toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit' }); }
  private isoDate(date: Date): string { return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`; }
}
