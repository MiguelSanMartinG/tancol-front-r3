import { Component, effect, inject, OnDestroy, OnInit, untracked, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AppPrimengModule } from '@shared/app-primeng/app-primeng.module';
import { BotonRegresarComponent } from '@shared/components/boton-regresar/boton-regresar.component';
import { HeaderComponent } from '@shared/components/header/header.component';
import { ImportFileComponent } from '@shared/components/import-file/import-file.component';
import { DatetimePipe } from '@shared/pipes/datetime.pipe';
import { DateTimeFormatService } from '@shared/services/date-time-format.service';
import {
  CatalogTableState,
  localPageSource,
  NativeColumn,
  NativeTableComponent,
  NATIVE_TABLE_IMPORTS,
  readPath,
} from '@shared/ui/native-table';
import { tap } from 'rxjs';
import { AlmacenApiService } from '../../almacen/services/almacen.api.service';
import { AlmacenCreateDto } from '../../almacen/services/dtos/almacen.create.dto';
import { AlmacenResponseDto } from '../../almacen/services/dtos/almacen.response.dto';
import { ProductoCreateDto } from '../../producto/services/dtos/producto.create.dto';
import { ProductoResponseDto } from '../../producto/services/dtos/producto.response.dto';
import { ProductoApiService } from '../../producto/services/producto.api.service';
import { ProveedorCreateDto } from '../../proveedor/services/dtos/proveedor.create.dto';
import { ProveedorResponseDto } from '../../proveedor/services/dtos/proveedor.response.dto';
import { ProveedorApiService } from '../../proveedor/services/proveedor.api.service';
import { UnidadMedidaDTO } from '../../unidades-medida/service/unidad-medida.dto';
import { UnidadMedidaResponse } from '../../unidades-medida/service/unidad-medida.response';
import { UnidadMedidaService } from '../../unidades-medida/service/unidad-medida.service';
import { EliminarComponent } from '../eliminar/eliminar.component';
import { InventarioInicialResponse } from '../services/inventario-inicia.response';
import { InventarioInicialService } from '../services/inventario-inicial.service';

@Component({
  selector: 'app-principal',
  imports: [
    BotonRegresarComponent,
    HeaderComponent,
    AppPrimengModule,
    EliminarComponent,
    ImportFileComponent,
    DatetimePipe,
    ...NATIVE_TABLE_IMPORTS,
  ],
  templateUrl: './principal.component.html',
  styleUrl: './principal.component.scss',
})
export class PrincipalComponent implements OnInit, OnDestroy {
  private readonly api = inject(InventarioInicialService);
  readonly almacenApiService = inject(AlmacenApiService);
  private readonly productoApiService = inject(ProductoApiService);
  private readonly unidadMedidaApiService = inject(UnidadMedidaService);
  private readonly proveedorApiService = inject(ProveedorApiService);
  private readonly dateTimeFormatService = inject(DateTimeFormatService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  @ViewChild(EliminarComponent) eliminarComponent!: EliminarComponent;
  @ViewChild(ImportFileComponent) importFile?: ImportFileComponent;
  @ViewChild(NativeTableComponent)
  set nativeTable(table: NativeTableComponent | undefined) {
    this.page.table = table;
  }

  readonly configurationImport = {
    service: this.api as any,
    properties: [
      {
        nameProperty: 'idAlmacen',
        label: 'Almacen',
        column: '',
        id: true,
        unique: false,
        serviceName: 'AlmacenApiService',
        query: '?nombre=',
        required: true,
        type: 'catalog',
        createField: 'nombre',
        catalogValues: [],
        service: null,
        getId: (result: AlmacenResponseDto) => result.id,
      },
      {
        nameProperty: 'idProducto',
        label: 'Producto',
        column: '',
        id: true,
        unique: false,
        serviceName: 'ProductoApiService',
        query: '?nombre=',
        required: true,
        type: 'catalog',
        createField: 'nombre',
        catalogValues: [],
        service: null,
        getId: (result: ProductoResponseDto) => result.id,
      },
      {
        nameProperty: 'cantidad',
        label: 'Cantidad',
        column: '',
        unique: false,
        id: false,
        required: true,
        type: 'number',
      },
      {
        nameProperty: 'unidadDeMedida',
        label: 'Unidad de medida',
        column: '',
        id: true,
        unique: false,
        serviceName: 'UnidadMedidaService',
        query: '?nombre=',
        required: true,
        type: 'catalog',
        createField: 'nombre',
        catalogValues: [],
        service: null,
        getId: (result: UnidadMedidaResponse) => result.idUnidadDeMedida,
      },
      {
        nameProperty: 'idProveedor',
        label: 'Proveedor',
        column: '',
        id: true,
        unique: false,
        serviceName: 'proveedorApiService',
        query: '?nombre=',
        required: false,
        type: 'catalog',
        createField: 'nombre',
        catalogValues: [],
        service: null,
        getId: (result: ProveedorResponseDto) => result.idProveedor,
      },
      {
        nameProperty: 'precioProveedor',
        label: 'Precio',
        column: '',
        unique: false,
        id: false,
        required: false,
        type: 'number',
      },
    ],
    titleDownload: 'Inventario inicial',
  };

  readonly columns: NativeColumn<InventarioInicialResponse>[] = [
    { id: 'index', label: 'ID', width: 72, minWidth: 56, sortable: false, tooltip: false, align: 'left' },
    { id: 'almacen', label: 'Almacén', width: 200, filter: { type: 'text' }, align: 'center' },
    { id: 'producto', label: 'Producto', width: 260, filter: { type: 'text' }, align: 'center' },
    { id: 'cantidad', label: 'Cantidad', field: 'cantidad', width: 130, filter: { type: 'number' }, align: 'center' },
    { id: 'unidadesMedida', label: 'Unidad de medida', width: 170, filter: { type: 'text' }, align: 'center' },
    { id: 'createdAt', label: 'Creado', width: 170, filter: { type: 'date' }, align: 'center' },
    { id: 'updatedAt', label: 'Actualizado', width: 170, filter: { type: 'date' }, align: 'center' },
    { id: 'acciones', label: 'Acciones', width: 100, minWidth: 90, sortable: false, tooltip: false, align: 'center' },
  ];

  /** Última lista recibida del servidor; si el servicio cambia `listAll` (p. ej. al eliminar), se recarga. */
  private lastList: unknown = this.api.listAll();
  private readonly source = localPageSource<InventarioInicialResponse>(
    () => this.api.getAll().pipe(tap((list) => (this.lastList = list))),
    this.columns,
    {
      value: (row, key) => {
        switch (key) {
          case 'almacen':
            return row.almacen?.nombre;
          case 'producto':
            return row.producto?.nombre;
          case 'unidadesMedida':
            return row.unidadesMedida?.nombre;
          case 'updatedAt':
            return row.updatedAt || row.createdAt;
          default:
            return readPath(row, key);
        }
      },
    },
  );
  readonly page = new CatalogTableState<InventarioInicialResponse>(this.source.request);

  constructor() {
    effect(() => {
      const list = this.api.listAll();
      if (list !== this.lastList) untracked(() => this.reload());
    });
    this.cargarCatalogosImportacion();
  }

  ngOnInit(): void {
    this.page.resetAndLoad();
  }

  ngOnDestroy(): void {
    this.page.destroy();
  }

  reload(): void {
    this.source.invalidate();
    this.page.resetAndLoad();
  }

  displayCreate(): void {
    this.router.navigate(['../crear'], { relativeTo: this.route });
  }

  displayDelete(item: InventarioInicialResponse): void {
    this.eliminarComponent.itemDto.set({ ...item });
    this.eliminarComponent.display = true;
  }

  /** Exporta la lista completa con los mismos campos que antes (fechas como Date y texto formateado). */
  exportar(): void {
    const filas = this.api.listAll().map((row) => ({
      ...row,
      createdAt: new Date(row.createdAt),
      updatedAt: row.updatedAt ? new Date(row.updatedAt) : new Date(row.createdAt),
      createdAtStr: this.dateTimeFormatService.format(row.createdAt),
      updatedAtStr: this.dateTimeFormatService.format(row.updatedAt ? row.updatedAt : row.createdAt),
    }));
    this.importFile?.export(filas);
  }

  /** Catálogos que usa el importador para resolver (o crear) almacén, producto, unidad y proveedor. */
  private cargarCatalogosImportacion(): void {
    this.almacenApiService.getAll().subscribe((data) => {
      this.asignarCatalogo(
        'idAlmacen',
        data.map((item) => ({ label: item.nombre, value: item.id })),
        { create: (dto: AlmacenCreateDto) => this.almacenApiService.create(dto) },
      );
    });
    this.productoApiService.getAll().subscribe((data) => {
      this.asignarCatalogo(
        'idProducto',
        data.map((item) => ({ label: item.nombre, value: item.idProducto })),
        { create: (dto: ProductoCreateDto) => this.productoApiService.create(dto) },
      );
    });
    this.unidadMedidaApiService.getAll().subscribe((data) => {
      this.asignarCatalogo(
        'unidadDeMedida',
        data.map((item) => ({ label: item.nombre, value: item.idUnidadDeMedida })),
        { create: (dto: UnidadMedidaDTO) => this.unidadMedidaApiService.create(dto) },
      );
    });
    this.proveedorApiService.getAll().subscribe((data) => {
      this.asignarCatalogo(
        'idProveedor',
        data.map((item) => ({ label: item.nombreComercial, value: item.idProveedor })),
        { create: (dto: ProveedorCreateDto) => this.proveedorApiService.create(dto) },
      );
    });
  }

  private asignarCatalogo(nameProperty: string, catalogValues: { label: string; value: unknown }[], service: unknown): void {
    const propiedad: any = this.configurationImport.properties.find((p) => p.nameProperty === nameProperty);
    if (propiedad) {
      propiedad.catalogValues = catalogValues;
      propiedad.service = service;
    }
  }
}
