import { Component, inject, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Observable } from 'rxjs';
import { AppPrimengModule } from '@shared/app-primeng/app-primeng.module';
import { BotonRegresarComponent } from '@shared/components/boton-regresar/boton-regresar.component';
import { HeaderComponent } from '@shared/components/header/header.component';
import { ImportFileComponent } from '@shared/components/import-file/import-file.component';
import { ExcelExportService, ExportColumn } from '@shared/services/excel.export.service';
import {
  CatalogTableState,
  localPageSource,
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
    ...NATIVE_TABLE_IMPORTS,
  ],
  templateUrl: './principal.component.html',
  styleUrl: './principal.component.scss',
})
export class PrincipalComponent implements OnInit, OnDestroy {
  readonly inventarioApiService = inject(InventarioService);
  readonly almacenApiService = inject(AlmacenApiService);
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
    { id: 'almacen', label: 'Almacén', width: 200, filter: { type: 'text' }, align: 'center' },
    { id: 'producto', label: 'Producto', width: 260, filter: { type: 'text' }, align: 'center' },
    { id: 'cantidad', label: 'Cantidad', width: 130, filter: { type: 'number' }, align: 'center' },
    { id: 'categoria', label: 'Categoría', width: 200, filter: { type: 'text' }, align: 'center' },
    { id: 'categoriaPadre', label: 'Categoría padre', width: 200, filter: { type: 'text' }, align: 'center' },
    { id: 'sku', label: 'SKU', width: 160, filter: { type: 'text' }, align: 'center' },
  ];

  private readonly source = localPageSource<InventarioResponse>(
    () => this.inventarioApiService.getAll() as unknown as Observable<InventarioResponse[]>,
    this.columns,
    {
      value: (row, key) => {
        switch (key) {
          case 'almacen': return row.almacen?.nombre;
          case 'producto': return row.producto?.nombre;
          case 'categoria': return row.producto?.categoria?.nombre;
          case 'categoriaPadre': return row.producto?.categoria?.nombreCategoriaPadre;
          case 'sku': return row.producto?.sku;
          default: return (row as unknown as Record<string, unknown>)[key];
        }
      },
    },
  );
  readonly page = new CatalogTableState<InventarioResponse>(this.source.request);

  ngOnInit(): void {
    this.page.resetAndLoad();
  }

  ngOnDestroy(): void {
    this.page.destroy();
  }

  recargar(): void {
    this.source.invalidate();
    this.page.resetAndLoad();
  }

  exportar(): void {
    const rows: InventarioExportRow[] = this.inventarioApiService.listAll().map((row: any) => ({
      almacen: row.almacen?.nombre ?? '',
      producto: row.producto?.nombre ?? '',
      cantidad: row.cantidad ?? 0,
      unidadMedida: row.producto?.unidadMedidaDefault?.nombre
        ?? row.producto?.unidadesMedida?.nombre
        ?? row.unidadesMedida?.nombre
        ?? '',
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
