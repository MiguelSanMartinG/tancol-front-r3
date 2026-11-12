import {
  Component,
  computed,
  inject,
  OnDestroy,
  OnInit,
  signal,
  ViewChild,
} from '@angular/core';
import { AppPrimengModule } from '@shared/app-primeng/app-primeng.module';
import { BotonRegresarComponent } from '@shared/components/boton-regresar/boton-regresar.component';
import { HeaderComponent } from '@shared/components/header/header.component';
import { EditarComponent } from '../editar/editar.component';
import { RegistrarProveedorComponent } from '../registrar/registrar.component';
import { ProveedorApiService } from '../services/proveedor.api.service';
import { DatetimePipe } from '@shared/pipes/datetime.pipe';
import { ProveedorResponseDto } from '../services/dtos/proveedor.response.dto';
import { EliminarComponent } from '../eliminar/eliminar.component';
import { ActivatedRoute, Router } from '@angular/router';
import { ImportFileComponent } from '@shared/components/import-file/import-file.component';
import { TipoClienteResponse } from '../../tipo-cliente/services/tipo-cliente-response';
import { TipoProveedorResponseDto } from '../../tipo-proveedor/services/dtos/tipo-proveedor.response.dto';
import { TipoProveedorApiService } from '../../tipo-proveedor/services/tipo-proveedor.api.service';
import { TipoProveedorCreateDto } from '../../tipo-proveedor/services/dtos/tipo-proveedor.create.dto';
import { CommonModule } from '@angular/common';
import {
  ensureNativeBuffer,
  NativeColumn,
  NativeFilters,
  NativeSort,
  NativeTableComponent,
  PageFetchController,
  placeNativeChunk,
  TcNativeTableCellDirective,
  TcNativeTableEmptyDirective,
  totalAfterChunk,
  VisibleRangeChange,
} from '@shared/ui/native-table';

@Component({
  selector: 'app-principal',
  imports: [
    BotonRegresarComponent,
    HeaderComponent,
    AppPrimengModule,
    RegistrarProveedorComponent,
    EditarComponent,
    DatetimePipe,
    EliminarComponent,
    ImportFileComponent,
    CommonModule,
    NativeTableComponent,
    TcNativeTableCellDirective,
    TcNativeTableEmptyDirective,
  ],
  templateUrl: './principal.component.html',
  styleUrl: './principal.component.scss',
})
export class PrincipalComponent implements OnInit, OnDestroy {
  update = false;
  proveedorApiService = inject(ProveedorApiService);
    tipoProveedorApiService = inject(TipoProveedorApiService);
  
  @ViewChild(RegistrarProveedorComponent) registrarComponent!: RegistrarProveedorComponent;
  @ViewChild(EditarComponent) editarComponent!: EditarComponent;
  @ViewChild(EliminarComponent) eliminarComponent!: EliminarComponent;
  @ViewChild(NativeTableComponent) nativeTable?: NativeTableComponent;
  private readonly fetchCtrl = new PageFetchController();
  private readonly loadedPages = new Set<number>();
  private loadGen = 0;
  private searchTimer: ReturnType<typeof setTimeout> | null = null;
  readonly rows = signal<(ProveedorResponseDto & { placeholder?: boolean })[]>([]);
  readonly total = signal(0);
  readonly loading = signal(false);
  readonly pageSize = signal(50);
  readonly sort = signal<NativeSort | null>(null);
  readonly filters = signal<NativeFilters>({});
  readonly selectedIndex = signal(-1);
  readonly tipoOptions = signal<{ value: string; label: string }[]>([]);
  searchDraft = '';
  readonly contribuyenteOptions = [
    { value: 'FISICA', label: 'Física' },
    { value: 'MORAL', label: 'Moral' },
    { value: 'SIN_OBLIGACIONES', label: 'Sin obligaciones' },
  ];
  readonly columns = computed<NativeColumn<ProveedorResponseDto>[]>(() => [
    { id: 'index', label: 'ID', width: 72, minWidth: 56, sortable: false, pinnable: true, tooltip: false, align: 'left' },
    { id: 'nombreComercial', label: 'Nombre comercial', field: 'nombreComercial', width: 200, filter: { type: 'text' }, align: 'center' },
    { id: 'razonSocial', label: 'Razón social', width: 200, filter: { type: 'text' }, align: 'center' },
    { id: 'rfc', label: 'RFC', width: 150, filter: { type: 'text' }, align: 'center' },
    {
      id: 'idTipoProveedor',
      label: 'Tipo de proveedor',
      width: 180,
      sortKey: 'nombreTipoProveedor',
      filter: { type: 'select', options: this.tipoOptions() },
      align: 'center',
    },
    {
      id: 'tipoContribuyente',
      label: 'Tipo de contribuyente',
      width: 190,
      filter: { type: 'select', options: this.contribuyenteOptions },
      align: 'center',
    },
    { id: 'createdAt', label: 'Creado', field: 'createdAt', width: 170, filter: { type: 'date' }, align: 'center' },
    { id: 'updatedAt', label: 'Modificado', field: 'updatedAt', width: 170, filter: { type: 'date' }, align: 'center' },
    { id: 'acciones', label: 'Acciones', width: 120, sortable: false, filter: undefined, tooltip: false, align: 'center' },
  ]);
configurationImport = {
  service:null,
  properties: [
    {
      nameProperty: 'nombreComercial',
      label: 'Nombre comercial',
      column: '',
      unique: true,
      id: false,
      required: true,
      type: 'text',
    },
    {
      nameProperty: 'tipoPago',
      label: 'Tipo de pago',
      column: '',
      unique: false,
      id: false,
      required: true,
      type: 'enum',
      enumValues: ['CONTADO', 'CREDITO'], // Agrega aquí tus opciones válidas
    },
    {
      nameProperty: 'fechaAlta',
      label: 'Fecha alta',
      column: '',
      unique: false,
      id: false,
      required: true,
      type: 'date',
    },
    {
      nameProperty: 'idTipoProveedor',
      label: 'Tipo Proveedor',
      column: '',
      id: true,
      unique: false,
      serviceName: 'tipoProveedorApiService',
      query: '?nombre=',
      required: true,
      type: 'catalog',
        createField: 'nombre', // 👈 importante
  catalogValues: [],
  service:null,
    getId: (result: TipoProveedorResponseDto) => result.id // 👈 aquí defines cómo extraer el id

    },
    {
      nameProperty: 'correo',
      label: 'Correo',
      column: '',
      required: false,
      id: false,
      type: 'text',
    },
    {
      nameProperty: 'telefono',
      label: 'Teléfono',
      column: '',
      required: false,
      id: false,
      type: 'text',
    },
    {
      nameProperty: 'diasDeCredito',
      label: 'Días de crédito',
      column: '',
      required: true,
      id: false,
      type: 'number',
    },
    {
      nameProperty: 'razonSocial',
      label: 'Razón social',
      column: '',
      required: false,
      id: false,
      type: 'text',
       parentProperty: 'informacionFiscal'
    },
    {
      nameProperty: 'rfc',
      label: 'RFC',
      column: '',
      required: false,
      id: false,
      type: 'text',
       parentProperty: 'informacionFiscal'
    },
    {
      nameProperty: 'tipoContribuyente',
      label: 'Tipo contribuyente',
      column: '',
      required: false,
      id: false,
      type: 'enum',
      enumValues: ['FISICA', 'MORAL'],
       parentProperty: 'informacionFiscal'
    },
    {
      nameProperty: 'calle1',
      label: 'Calle 1',
      column: '',
      required: false,
      id: false,
      type: 'text',
       parentProperty: 'informacionFiscal'
    },
    {
      nameProperty: 'calle2',
      label: 'Calle 2',
      column: '',
      required: false,
      id: false,
      type: 'text',
       parentProperty: 'informacionFiscal'
    },
    {
      nameProperty: 'codigoPostal',
      label: 'Código postal',
      column: '',
      required: false,
      id: false,
      type: 'text',
       parentProperty: 'informacionFiscal'
    },
    {
      nameProperty: 'colonia',
      label: 'Colonia',
      column: '',
      required: false,
      id: false,
      type: 'text',
       parentProperty: 'informacionFiscal'
    },
    {
      nameProperty: 'entidadFederativa',
      label: 'Entidad federativa',
      column: '',
      required: false,
      id: false,
      type: 'text',
       parentProperty: 'informacionFiscal'
    },
    {
      nameProperty: 'localidad',
      label: 'Localidad',
      column: '',
      required: false,
      id: false,
      type: 'text',
       parentProperty: 'informacionFiscal'
    },
    {
      nameProperty: 'municipio',
      label: 'Municipio',
      column: '',
      required: false,
      id: false,
      type: 'text',
       parentProperty: 'informacionFiscal'
    },
    {
      nameProperty: 'nombreVialidad',
      label: 'Nombre vialidad',
      column: '',
      required: false,
      id: false,
      type: 'text',
       parentProperty: 'informacionFiscal'
    },
    {
      nameProperty: 'numeroExterior',
      label: 'Número exterior',
      column: '',
      required: false,
      id: false,
      type: 'text',
       parentProperty: 'informacionFiscal'
    },
    {
      nameProperty: 'numeroInterior',
      label: 'Número interior',
      column: '',
      required: false,
      id: false,
      type: 'text',
       parentProperty: 'informacionFiscal'
    },
    {
      nameProperty: 'tipoVialidad',
      label: 'Tipo vialidad',
      column: '',
      required: false,
      id: false,
      type: 'text',
       parentProperty: 'informacionFiscal'
    }
  ],
  // columns: [
  //   { header: 'id', key: 'id', width: 10 },
  //   { header: 'Nombre comercial', key: 'nombreComercial', width: 30 },
  //   { header: 'Correo', key: 'correo', width: 30 },
  //   { header: 'Teléfono', key: 'telefono', width: 20 },
  //   { header: 'Fecha alta', key: 'fechaAlta', width: 20 },
  //   { header: 'Tipo cliente', key: 'idTipoDeCliente', width: 20 },
  //   { header: 'Estado', key: 'enabled', width: 20 },
  // ],
  titleDownload: 'clientes',
};
catalogoProveedorService:any
  constructor(
    private router: Router,
    private route: ActivatedRoute,
  ) {

      this.tipoProveedorApiService.getAll().subscribe(data =>{
        const catalogoTipoProveedor = data.map((item:any)=>({
          label:item.nombre,
          value:item.id
        }));
        this.catalogoProveedorService = {
          create: (data:TipoProveedorCreateDto) => this.tipoProveedorApiService.create(data)
        }
        this.tipoOptions.set(catalogoTipoProveedor);

  // Asignar el catálogo en la configuración del importador
  const propiedadTipoProveedor:any = this.configurationImport.properties.find(p => p.nameProperty === 'idTipoProveedor');
  if (propiedadTipoProveedor) {
    propiedadTipoProveedor.catalogValues = catalogoTipoProveedor;
    propiedadTipoProveedor.service = this.catalogoProveedorService;
    console.log('this.configurationImport',this.configurationImport);
  }





      })
  this.configurationImport.service = <any> this.proveedorApiService



    }

  ngOnInit(): void {
    this.resetAndLoad();
  }

  ngOnDestroy(): void {
    this.fetchCtrl.cancelAll();
    if (this.searchTimer != null) clearTimeout(this.searchTimer);
  }

  resetAndLoad(): void {
    this.fetchCtrl.cancelAll();
    this.loadedPages.clear();
    this.loadGen += 1;
    const gen = this.loadGen;
    this.total.set(0);
    this.rows.set([]);
    this.loading.set(true);
    this.selectedIndex.set(-1);
    this.nativeTable?.scrollToStart();
    this.fetchPage(1, true, gen);
  }

  onVisibleRange(range: VisibleRangeChange): void {
    if (this.loading()) return;
    this.fetchCtrl.retain(range.pages);
    for (const page of range.pages) {
      if (!this.loadedPages.has(page)) this.fetchPage(page, false, this.loadGen);
    }
  }

  onSort(sort: NativeSort | null): void {
    this.sort.set(sort);
    this.resetAndLoad();
  }

  onFilters(filters: NativeFilters): void {
    this.filters.set(filters);
    this.resetAndLoad();
  }

  onPageSize(pageSize: number): void {
    this.pageSize.set(pageSize);
    this.resetAndLoad();
  }

  onSearch(value: string): void {
    this.searchDraft = value;
    if (this.searchTimer != null) clearTimeout(this.searchTimer);
    this.searchTimer = setTimeout(() => {
      this.resetAndLoad();
    }, 300);
  }

  clearQuery(): void {
    if (this.searchTimer != null) clearTimeout(this.searchTimer);
    this.searchDraft = '';
    this.sort.set(null);
    this.filters.set({});
    this.resetAndLoad();
  }

  nombresTiposProveedor(row: ProveedorResponseDto): string {
    return row.tiposProveedor?.map((tipo) => tipo.nombre).join(', ') || row.nombreTipoProveedor || '';
  }

  contribuyenteLabel(value: string | null | undefined): string {
    return this.contribuyenteOptions.find((option) => option.value === value)?.label ?? (value ?? '');
  }

  private fetchPage(page: number, isReset: boolean, gen: number): void {
    const sub = this.proveedorApiService.getPage({
      page,
      pageSize: this.pageSize(),
      search: this.searchDraft.trim(),
      filters: this.filters(),
      sort: this.sort(),
    }).subscribe({
      next: (res) => {
        if (gen !== this.loadGen) return;
        this.loadedPages.add(page);
        const start = (page - 1) * this.pageSize();
        const items = res.items ?? [];
        const nextTotal = totalAfterChunk(start, items.length, this.pageSize(), res.total);
        this.rows.update((current) => placeNativeChunk(ensureNativeBuffer(current, nextTotal), start, items));
        this.total.set(nextTotal);
        if (isReset) {
          this.nativeTable?.scrollToStart();
          this.loading.set(false);
        }
      },
      error: () => {
        if (gen !== this.loadGen) return;
        if (isReset) this.loading.set(false);
      },
    });
    this.fetchCtrl.track(page, sub);
  }



  displayUpdate(itemDto: ProveedorResponseDto) {
    this.router.navigate(['../actualizar',itemDto.idProveedor], { relativeTo: this.route });

  }
  displayDelete(itemDto: ProveedorResponseDto) {
    this.eliminarComponent.itemDto.set({
      ...itemDto
    });
    this.eliminarComponent.display = true;
  }
  displayCreate() {
    this.router.navigate(['../crear'], { relativeTo: this.route });
  }
}
