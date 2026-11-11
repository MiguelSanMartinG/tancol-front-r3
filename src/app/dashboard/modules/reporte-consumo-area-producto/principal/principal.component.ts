import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { finalize } from 'rxjs';
import { AppPrimengModule } from '@shared/app-primeng/app-primeng.module';
import { BotonRegresarComponent } from '@shared/components/boton-regresar/boton-regresar.component';
import { HeaderComponent } from '@shared/components/header/header.component';
import { DateUtilService } from '@shared/services/date-util.service';
import { ExcelExportService, ExportColumn } from '@shared/services/excel.export.service';
import { EmpleadoApiService } from '../../empleados/services/empleado.api.service';
import { EmpleadoResponseDto, getEmpleadoNombreCompleto } from '../../empleados/services/dtos/empleado.response';
import { CategoriaProductoApiService } from '../../categoria-producto/services/categoria-producto.api.service';
import { CategoriaProductoResponseDto } from '../../categoria-producto/services/dtos/categoria-producto.response.dto';
import { ProductoApiService } from '../../producto/services/producto.api.service';
import { ProductoResponseDto } from '../../producto/services/dtos/producto.response.dto';
import { ReporteConsumoAreaProductoRequest, ReporteConsumoAreaProductoResponse, ReporteConsumoAreaProductoRow, ReporteConsumoAreaProductoService } from '../services/reporte-consumo-area-producto.service';

interface EmpleadoOption { id: string; nombre: string; }
interface InsumoOption { id: string; nombre: string; }
interface StringOption { label: string; value: string; }
interface ConsumoArea { area: string; productos: Array<{ insumo: string; cantidad: number }>; }

@Component({
  selector: 'app-reporte-consumo-area-producto',
  imports: [CommonModule, ReactiveFormsModule, AppPrimengModule, BotonRegresarComponent, HeaderComponent],
  templateUrl: './principal.component.html',
})
export class PrincipalComponent implements OnInit {
  private fb = inject(FormBuilder);
  private api = inject(ReporteConsumoAreaProductoService);
  private categoriasApi = inject(CategoriaProductoApiService);
  private empleadosApi = inject(EmpleadoApiService);
  private productosApi = inject(ProductoApiService);
  private dateUtil = inject(DateUtilService);

  filtro = this.fb.group({
    fechaInicio: [new Date()], fechaFin: [new Date()], idEmpleados: [[] as string[]], idInsumos: [[] as string[]],
    idCategorias: [[] as string[]], alias: [[] as string[]], marcas: [[] as string[]], modelos: [[] as string[]],
  });
  empleados: EmpleadoOption[] = [];
  insumos: InsumoOption[] = [];
  productos: ProductoResponseDto[] = [];
  categorias: Array<{ idCategoria: string; nombreCompleto: string }> = [];
  alias: StringOption[] = [];
  marcas: StringOption[] = [];
  modelos: StringOption[] = [];
  filas: ReporteConsumoAreaProductoRow[] = [];
  totalesPorInsumo: ReporteConsumoAreaProductoResponse['totalesPorInsumo'] = [];
  totalesPorEmpleado: ReporteConsumoAreaProductoResponse['totalesPorEmpleado'] = [];
  consumoPorArea: ConsumoArea[] = [];
  cargando = false;

  ngOnInit() {
    this.empleadosApi.getAll().subscribe((items) => this.empleados = items.filter((item) => item.enabled).map((item) => ({
      id: item.idEmpleado, nombre: getEmpleadoNombreCompleto(item) || item.email,
    })));
    this.productosApi.getAll().subscribe((items) => {
      this.productos = items.filter((item) => item.enabled);
      this.insumos = this.productos.map((item) => ({ id: item.idProducto, nombre: item.nombre }));
      this.alias = this.opcionesProducto((item) => item.alias);
      this.marcas = this.opcionesProducto((item) => item.marca);
      this.modelos = this.opcionesProducto((item) => item.modelo);
    });
    this.categoriasApi.getAll().subscribe((items) => this.cargarCategorias(items));
  }

  get puedeBuscar(): boolean {
    const { fechaInicio, fechaFin } = this.filtro.getRawValue();
    return !!fechaInicio && !!fechaFin && new Date(fechaInicio).getTime() <= new Date(fechaFin).getTime();
  }

  buscar() {
    const value = this.filtro.getRawValue();
    if (!this.puedeBuscar || !value.fechaInicio || !value.fechaFin) return;
    const productFiltersSelected = !!(value.idInsumos?.length || value.marcas?.length || value.modelos?.length);
    const filteredProductIds = this.productos.filter((product) =>
      (!value.idInsumos?.length || value.idInsumos.includes(product.idProducto)) &&
      (!value.marcas?.length || value.marcas.includes(product.marca ?? '')) &&
      (!value.modelos?.length || value.modelos.includes(product.modelo ?? ''))
    ).map((product) => product.idProducto);
    if (productFiltersSelected && !filteredProductIds.length) {
      this.cargando = false;
      this.filas = [];
      this.consumoPorArea = [];
      this.totalesPorInsumo = [];
      this.totalesPorEmpleado = [];
      return;
    }

    const body: ReporteConsumoAreaProductoRequest = {
      fechaInicio: this.dateUtil.toUTCStartOfDay(new Date(value.fechaInicio)),
      fechaFin: this.dateUtil.toUTCEndOfDay(new Date(value.fechaFin)),
      idEmpleados: value.idEmpleados ?? [],
      idInsumos: productFiltersSelected ? filteredProductIds : [],
      idCategorias: value.idCategorias ?? [],
      alias: value.alias ?? [],
    };
    this.cargando = true;
    this.api.consultar(body).pipe(finalize(() => this.cargando = false)).subscribe({
      next: (response) => {
        const areas = new Map<string, Map<string, number>>();
        for (const grupo of response.grupos ?? []) {
          const productos = areas.get(grupo.area) ?? new Map<string, number>();
          productos.set(grupo.insumo, (productos.get(grupo.insumo) ?? 0) + grupo.cantidad);
          areas.set(grupo.area, productos);
        }
        this.consumoPorArea = [...areas].map(([area, productos]) => ({
          area,
          productos: [...productos].map(([insumo, cantidad]) => ({ insumo, cantidad })),
        }));
        this.filas = (response.grupos ?? []).flatMap((grupo) => grupo.filas ?? []);
        this.totalesPorInsumo = response.totalesPorInsumo ?? [];
        this.totalesPorEmpleado = response.totalesPorEmpleado ?? [];
      },
      error: () => {
        this.filas = [];
        this.consumoPorArea = [];
        this.totalesPorInsumo = [];
        this.totalesPorEmpleado = [];
      },
    });
  }

  limpiar() {
    this.filtro.reset({ fechaInicio: new Date(), fechaFin: new Date(), idEmpleados: [], idInsumos: [], idCategorias: [], alias: [], marcas: [], modelos: [] });
    this.filas = [];
    this.consumoPorArea = [];
    this.totalesPorInsumo = [];
    this.totalesPorEmpleado = [];
  }

  exportar() {
    if (!this.filas.length) return;
    const columnas: ExportColumn[] = [
      { header: 'Fecha', key: 'fecha', width: 22 }, { header: 'Empleado', key: 'empleado', width: 28 },
      { header: 'Insumo', key: 'insumo', width: 28 }, { header: 'Cantidad solicitada', key: 'cantidadSolicitada', width: 20 },
      { header: 'Comentario de partida', key: 'comentarioPartida', width: 40 },
    ];
    ExcelExportService.exportAsExcelFile(this.filas.map((fila) => ({ ...fila, fecha: this.formatearFecha(fila.fecha) })), columnas, 'reporte-consumo-area-producto');
  }

  formatearFecha(fecha: string): string {
    const date = new Date(fecha);
    return Number.isNaN(date.getTime()) ? fecha : date.toLocaleString('es-MX');
  }

  private opcionesProducto(getValue: (product: ProductoResponseDto) => string | null | undefined): StringOption[] {
    return [...new Set(this.productos.map(getValue).filter((value): value is string => !!value?.trim()))]
      .sort((a, b) => a.localeCompare(b, 'es')).map((value) => ({ label: value, value }));
  }

  private cargarCategorias(items: CategoriaProductoResponseDto[]) {
    const porId = new Map(items.map((item) => [item.idCategoria, item]));
    this.categorias = items.filter((item) => item.enabled).map((item) => {
      const padre = item.idCategoriaPadre ? porId.get(item.idCategoriaPadre) : undefined;
      return { idCategoria: item.idCategoria, nombreCompleto: padre ? `${padre.nombre} / ${item.nombre}` : item.nombre };
    }).sort((a, b) => a.nombreCompleto.localeCompare(b.nombreCompleto));
  }
}
