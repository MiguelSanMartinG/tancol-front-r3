import { Component, computed, inject, OnDestroy, OnInit, signal, ViewChild } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { MessageService } from 'primeng/api';
import { catchError, forkJoin, map, of } from 'rxjs';
import { AppPrimengModule } from '@shared/app-primeng/app-primeng.module';
import { BotonRegresarComponent } from '@shared/components/boton-regresar/boton-regresar.component';
import { HeaderComponent } from '@shared/components/header/header.component';
import { ImportFileComponent } from '@shared/components/import-file/import-file.component';
import { ExcelExportService, ExportColumn } from '@shared/services/excel.export.service';
import {
  CatalogTableState,
  NativeColumn,
  NativeTableComponent,
  NATIVE_TABLE_IMPORTS,
} from '@shared/ui/native-table';
import { AlmacenApiService } from '../../almacen/services/almacen.api.service';
import { InventarioResponse } from '../services/dto/inventario.response';
import { InventarioService } from '../services/inventario.service';

interface InventarioExportRow {
  almacen: string;
  producto: string;
  cantidad: number;
  unidadMedida: string;
  categoria: string;
  categoriaPadre: string;
  sku: string;
}

@Component({
  selector: 'app-principal',
  imports: [
    BotonRegresarComponent,
    HeaderComponent,
    AppPrimengModule,
    ImportFileComponent,
    DecimalPipe,
    ...NATIVE_TABLE_IMPORTS,
  ],
  templateUrl: './principal.component.html',
  styleUrl: './principal.component.scss',
})
export class PrincipalComponent implements OnInit, OnDestroy {
  readonly inventarioApiService = inject(InventarioService);
  readonly almacenApiService = inject(AlmacenApiService);
  private readonly messageService = inject(MessageService);

  /** Registros marcados para el borrado masivo (idInventario → fila). */
  readonly seleccionados = signal<Map<string, InventarioResponse>>(new Map());
  readonly filasSeleccionadas = computed(() => [...this.seleccionados().values()]);
  readonly conExistencia = computed(() => this.filasSeleccionadas().filter((row) => (row.cantidad ?? 0) > 0));
  readonly existenciaTotal = computed(() => this.conExistencia().reduce((total, row) => total + (row.cantidad ?? 0), 0));
  readonly eliminando = signal(false);
  dialogoEliminar = false;
  confirmoIrreversible = false;
  @ViewChild(ImportFileComponent) importFile?: ImportFileComponent;
  @ViewChild(NativeTableComponent)
  set nativeTable(table: NativeTableComponent | undefined) {
    this.page.table = table;
  }

  readonly configurationImport = {
    properties: [
      { nameProperty: 'id', label: 'id', column: '', id: true },
      { nameProperty: 'nombre', label: 'Nombre', column: '', unique: true, id: false },
      { nameProperty: 'status', label: 'Estado', column: '', id: false, update: true },
    ],
    columns: [
      { header: 'id', key: 'id', width: 10 },
      { header: 'Nombre', key: 'nombre', width: 20 },
      { header: 'Estado', key: 'status', width: 20 },
    ],
    titleDownload: 'almacenes',
  };

  readonly columns: NativeColumn<InventarioResponse>[] = [
    { id: 'index', label: 'ID', width: 72, minWidth: 56, sortable: false, tooltip: false, align: 'left' },
    { id: 'seleccion', label: '', width: 48, minWidth: 44, sortable: false, tooltip: false, pinnable: false, align: 'center' },
    { id: 'almacen', label: 'Almacén', width: 200, filter: { type: 'text' }, align: 'left' },
    { id: 'producto', label: 'Producto', width: 260, filter: { type: 'text' }, align: 'left' },
    { id: 'cantidad', label: 'Cantidad', width: 130, filter: { type: 'number' }, align: 'left' },
    { id: 'unidadMedida', label: 'Unidad de medida', width: 150, sortable: false, filter: { type: 'text' }, align: 'left' },
    { id: 'categoria', label: 'Categoría', width: 200, filter: { type: 'text' }, align: 'left' },
    { id: 'categoriaPadre', label: 'Categoría padre', width: 200, filter: { type: 'text' }, align: 'left' },
    { id: 'sku', label: 'SKU', width: 160, filter: { type: 'text' }, align: 'left' },
  ];

  /** Paginación, filtros, búsqueda y orden en el servidor (GET inventario/page). */
  readonly page = new CatalogTableState<InventarioResponse>((query) => this.inventarioApiService.getPage(query));
  readonly exportando = signal(false);

  /** Unidad de medida del producto (la misma que se exporta). */
  unidad(row: any): string {
    return row.producto?.unidadMedidaDefault?.nombre
      ?? row.producto?.unidadesMedida?.nombre
      ?? row.unidadesMedida?.nombre
      ?? '';
  }

  ngOnInit(): void {
    this.page.resetAndLoad();
  }

  ngOnDestroy(): void {
    this.page.destroy();
  }

  alternar(row: InventarioResponse, marcado: boolean): void {
    if (!row?.idInventario) return;
    this.seleccionados.update((actual) => {
      const siguiente = new Map(actual);
      if (marcado) siguiente.set(row.idInventario, row);
      else siguiente.delete(row.idInventario);
      return siguiente;
    });
  }

  abrirEliminar(): void {
    if (!this.seleccionados().size) return;
    this.confirmoIrreversible = false;
    this.dialogoEliminar = true;
  }

  /** Borra uno por uno; los que fallen se reportan y se quedan seleccionados. */
  eliminarSeleccionados(): void {
    const filas = this.filasSeleccionadas();
    if (!filas.length || !this.confirmoIrreversible || this.eliminando()) return;
    this.eliminando.set(true);
    forkJoin(
      filas.map((row) =>
        this.inventarioApiService.delete(row.idInventario).pipe(
          map(() => ({ row, ok: true })),
          catchError(() => of({ row, ok: false })),
        ),
      ),
    ).subscribe((resultados) => {
      const fallidos = resultados.filter((r) => !r.ok).map((r) => r.row);
      const eliminados = resultados.length - fallidos.length;
      this.seleccionados.set(new Map(fallidos.map((row) => [row.idInventario, row])));
      this.eliminando.set(false);
      this.dialogoEliminar = false;
      if (eliminados > 0) {
        this.messageService.add({
          key: 'top-right',
          severity: 'success',
          summary: 'Inventario',
          detail: eliminados === 1 ? 'Se eliminó 1 registro.' : `Se eliminaron ${eliminados} registros.`,
        });
      }
      if (fallidos.length > 0) {
        this.messageService.add({
          key: 'top-right',
          severity: 'warn',
          summary: 'No se pudieron eliminar',
          detail: `${fallidos.length} ${fallidos.length === 1 ? 'registro sigue' : 'registros siguen'} seleccionado(s): puede que estén usados en un cuadre de inventario u otro movimiento.`,
          life: 8000,
        });
      }
      this.recargar();
    });
  }

  recargar(): void {
    this.page.resetAndLoad();
  }

  /** La tabla ya no carga todo: al pulsar Exportar se pide la lista completa y luego se exporta. */
  exportar(): void {
    if (this.exportando()) return;
    this.exportando.set(true);
    this.inventarioApiService.getAll().subscribe({
      next: (lista) => {
        this.exportando.set(false);
        this.exportarFilas((lista ?? []) as unknown as InventarioResponse[]);
      },
      error: () => this.exportando.set(false),
    });
  }

  private exportarFilas(lista: InventarioResponse[]): void {
    const rows: InventarioExportRow[] = lista.map((row: any) => ({
      almacen: row.almacen?.nombre ?? '',
      producto: row.producto?.nombre ?? '',
      cantidad: row.cantidad ?? 0,
      unidadMedida: this.unidad(row),
      categoria: row.producto?.categoria?.nombre ?? '',
      categoriaPadre: row.producto?.categoria?.nombreCategoriaPadre ?? '',
      sku: row.producto?.sku ?? '',
    }));
    const columns: ExportColumn<InventarioExportRow>[] = [
      { header: 'Almacén', key: 'almacen', width: 24 },
      { header: 'Producto', key: 'producto', width: 32 },
      { header: 'Cantidad', key: 'cantidad', width: 14 },
      { header: 'Unidad de medida', key: 'unidadMedida', width: 20 },
      { header: 'Categoría', key: 'categoria', width: 24 },
      { header: 'Categoría padre', key: 'categoriaPadre', width: 24 },
      { header: 'SKU', key: 'sku', width: 18 },
    ];
    ExcelExportService.exportAsExcelFile(rows, columns, 'inventario');
  }
}
