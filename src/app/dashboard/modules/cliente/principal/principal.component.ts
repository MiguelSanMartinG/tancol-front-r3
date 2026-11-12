import { CommonModule } from '@angular/common';
import { Component, computed, inject, OnDestroy, OnInit, signal, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AppPrimengModule } from '@shared/app-primeng/app-primeng.module';
import { BotonRegresarComponent } from '@shared/components/boton-regresar/boton-regresar.component';
import { HeaderComponent } from '@shared/components/header/header.component';
import { ClienteApiService, HistorialPrecioCliente } from '../services/cliente.service';
import { TipoClienteApiService } from '../../tipo-cliente/services/tipo-cliente.api.service';
import { ClienteResponse } from '../services/cliente.response';
import { EliminarComponent } from '../eliminar/eliminar.component';
import { ImportFileComponent } from '../../../../shared/components/import-file/import-file.component';
import { CatalogoService } from '@shared/services/catalogo.service';
import { TipoClienteDto } from '../../tipo-cliente/services/tipo-cliente-dto';
import { TipoClienteResponse } from '../../tipo-cliente/services/tipo-cliente-response';
import { DateTimeFormatService } from '@shared/services/date-time-format.service';
import { DatetimePipe } from '@shared/pipes/datetime.pipe';
import { MenuItem } from 'primeng/api';
import { Menu } from 'primeng/menu';
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
  templateUrl: './principal.component.html',
  imports: [
    CommonModule,
    BotonRegresarComponent,
    HeaderComponent,
    AppPrimengModule,
    EliminarComponent,
    ImportFileComponent,
    DatetimePipe,
    NativeTableComponent,
    TcNativeTableCellDirective,
    TcNativeTableEmptyDirective,
  ],
  styleUrl: './principal.component.scss',
})
export class PrincipalComponent implements OnInit, OnDestroy {
  private readonly fetchCtrl = new PageFetchController();
  private readonly loadedPages = new Set<number>();
  private loadGen = 0;
  private searchTimer: ReturnType<typeof setTimeout> | null = null;

  update = false;
  clienteService = inject(ClienteApiService)
  catalogoService = inject(CatalogoService)
  tipoClienteApiService = inject(TipoClienteApiService);
  @ViewChild(EliminarComponent) eliminarComponent!: EliminarComponent;
  @ViewChild(NativeTableComponent) nativeTable?: NativeTableComponent;
  @ViewChild('importFile') importFile!: ImportFileComponent;

  readonly rows = signal<(ClienteResponse & { placeholder?: boolean })[]>([]);
  readonly total = signal(0);
  readonly loading = signal(false);
  readonly pageSize = signal(50);
  readonly sort = signal<NativeSort | null>(null);
  readonly filters = signal<NativeFilters>({});
  readonly selectedIndex = signal(-1);
  readonly tipoOptions = signal<{ value: string; label: string }[]>([]);
  searchDraft = '';

  readonly columns = computed<NativeColumn<ClienteResponse>[]>(() => [
    { id: 'noCliente', label: 'Número de cliente', field: 'noCliente', width: 110, minWidth: 88, filter: { type: 'text' }, align: 'left' },
    { id: 'nombreComercial', label: 'Nombre comercial', field: 'nombreComercial', width: 220, filter: { type: 'text' }, align: 'center' },
    { id: 'razonSocial', label: 'Razón social', width: 220, sortKey: 'razonSocial', filter: { type: 'text' }, align: 'center' },
    {
      id: 'idTipoDeCliente',
      label: 'Tipo de cliente',
      width: 170,
      sortKey: 'nombreTipoCliente',
      filter: { type: 'select', options: this.tipoOptions() },
      align: 'center',
    },
    { id: 'telefono', label: 'Teléfono', field: 'telefono', width: 140, filter: { type: 'text' }, align: 'center' },
    { id: 'fechaAlta', label: 'Antigüedad', field: 'fechaAlta', width: 140, filter: { type: 'date' }, align: 'center' },
    { id: 'createdAt', label: 'Creado', field: 'createdAt', width: 170, filter: { type: 'date' }, align: 'center' },
    { id: 'updatedAt', label: 'Modificado', field: 'updatedAt', width: 170, filter: { type: 'date' }, align: 'center' },
    { id: 'acciones', label: 'Acciones', width: 210, minWidth: 196, sortable: false, tooltip: false, align: 'center' },
  ]);
  historialPreciosVisible = false;
  loadingHistorialPrecios = false;
  historialPreciosError = false;
  clienteHistorialPrecios = '';
  historialPrecios: HistorialPrecioCliente[] = [];
  accionesMenuItems: MenuItem[] = [];
  tableList:TableListCliente[] = []
  listaSeleccionada: any[] = [];
  globalFields: string[] = [];
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
      nameProperty: 'idTipoDeCliente',
      label: 'Tipo cliente',
      column: '',
      id: true,
      unique: false,
      serviceName: 'tipoClienteApiService',
      query: '?nombre=',
      required: true,
      type: 'catalog',
        createField: 'nombre', // 👈 importante
  catalogValues: [],
  service:null,
    getId: (result: TipoClienteResponse) => result.idTiposClientes // 👈 aquí defines cómo extraer el id

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
  columns: [
    { header: 'Número de cliente', key: 'noCliente', width: 15 },
    { header: 'Nombre comercial', key: 'nombreComercial', width: 25 },
    { header: 'Razón social', key: 'razonSocial', width: 25 },
    { header: 'Tipo de cliente', key: 'tipoClienteNombre', width: 20 },
    { header: 'Tipo de pago', key: 'tipoPago', width: 15 },
    { header: 'Días de crédito', key: 'diasDeCredito', width: 15 },
    { header: 'Correo', key: 'correo', width: 25 },
    { header: 'Teléfono', key: 'telefono', width: 15 },
    { header: 'Fecha alta', key: 'fechaAltaStr', width: 15 },
    { header: 'RFC', key: 'rfc', width: 18 },
    { header: 'Código postal', key: 'codigoPostal', width: 15 },
    { header: 'Creado', key: 'createdAtStr', width: 20 },
    { header: 'Modificado', key: 'updatedAtStr', width: 20 },
  ],
  titleDownload: 'clientes',
};

catalogosCliente: { [catalogo: string]: any[] } = {
  tipoCliente: [],
  condicionesPago: []
};





    tipoClienteCatalogo: any[] = [];
  condicionesPagoCatalogo: any[] = [];
catalogoClienteService:any


  constructor(
    private router:Router,
    private route: ActivatedRoute,
    private dateTimeFormatService: DateTimeFormatService
  ){
    this.tipoClienteApiService.getAll().subscribe(data => {
  const catalogTipoCliente = data.map((item: any) => ({
    label: item.nombre,
    value: item.idTiposClientes
  }));
  this.tipoOptions.set(catalogTipoCliente);
  this.catalogoClienteService = {
  create: (data: TipoClienteDto) => this.tipoClienteApiService.create(data)
};

  // Asignar el catálogo en la configuración del importador
  const propiedadTipoCliente:any = this.configurationImport.properties.find(p => p.nameProperty === 'idTipoDeCliente');
  if (propiedadTipoCliente) {
    propiedadTipoCliente.catalogValues = catalogTipoCliente;
    propiedadTipoCliente.service = this.catalogoClienteService;
    console.log('this.configurationImport',this.configurationImport);
  }
});
  this.configurationImport.service = <any> this.clienteService
  }


// abrirImportar() {
//     this.importador.abrir();
//   }

crearCatalogo = async (
  catalogo: string,
  nombre: string
): Promise<{ id: number; nombre: string }> => {
  try {
    const nuevo = await this.catalogoService
      .crearCatalogo(catalogo, { nombre })
      .toPromise();

    if (!nuevo) {
      throw new Error('Respuesta vacía al crear catálogo');
    }

    // Agrega al catálogo local dinámicamente
    if (this.catalogosCliente[catalogo]) {
      this.catalogosCliente[catalogo].push(nuevo);
    } else {
      this.catalogosCliente[catalogo] = [nuevo];
    }

    return nuevo;
  } catch (err) {
    console.error(`❌ Error al crear catálogo "${catalogo}" con valor "${nombre}"`, err);
    throw err;
  }
};


  procesarImportados(result: { ok: any[], error: any[] }) {
    console.log('Registros válidos:', result.ok);
    console.log('Errores:', result.error);
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
    this.searchTimer = setTimeout(() => this.resetAndLoad(), 300);
  }

  clearQuery(): void {
    if (this.searchTimer != null) clearTimeout(this.searchTimer);
    this.searchDraft = '';
    this.sort.set(null);
    this.filters.set({});
    this.resetAndLoad();
  }

  texto(value: string | number | null | undefined): string {
    const text = value == null ? '' : String(value).trim();
    return text ? text : '-';
  }

  anterior(values: string[] | null | undefined): string {
    const text = values?.[0]?.trim();
    return text ? text : '';
  }

  exportar(): void {
    this.clienteService.getAll().subscribe((rows) => {
      this.importFile.export(rows.map((row) => this.filaExportacion(row)));
    });
  }
  displayUpdate(itemDto: ClienteResponse) {
    this.router.navigate(['../actualizar/',itemDto.id], { relativeTo: this.route });

  }
  displayReadOnly(itemDto: ClienteResponse) {
    this.router.navigate(['../actualizar/', itemDto.id], {
      relativeTo: this.route,
      queryParams: { readonly: true },
    });
  }
  displayDelete(itemDto: ClienteResponse) {
    this.eliminarComponent.itemDto.set({
      ...itemDto
    });
    this.eliminarComponent.display = true;
  }
  displayCreate() {
    this.router.navigate(['../crear'], { relativeTo: this.route });

  }
  products(item:any){
    this.router.navigate(['../producto/', item.id], { relativeTo: this.route });
  }

  equipos(item: any) {
    this.router.navigate(['../equipos/', item.id], { relativeTo: this.route });
  }

  abrirAcciones(event: Event, item: ClienteResponse, menu: Menu): void {
    this.accionesMenuItems = [
      { label: 'Productos', icon: 'fa-solid fa-bottle-water', command: () => this.products(item) },
      { label: 'Equipos', icon: 'fa-solid fa-toolbox', command: () => this.equipos(item) },
      { label: 'Historial de precios', icon: 'pi pi-history', command: () => this.verHistorialPrecios(item) },
    ];
    menu.toggle(event);
  }

  verHistorialPrecios(item: ClienteResponse): void {
    this.clienteHistorialPrecios = item.nombreComercial;
    this.historialPrecios = [];
    this.historialPreciosError = false;
    this.loadingHistorialPrecios = true;
    this.historialPreciosVisible = true;
    this.clienteService.getHistorialPrecios(item.id).subscribe({
      next: (rows) => {
        this.historialPrecios = rows ?? [];
        this.loadingHistorialPrecios = false;
      },
      error: () => {
        this.historialPreciosError = true;
        this.loadingHistorialPrecios = false;
      },
    });
  }

  goToPrecios() {
    this.router.navigate(['../precios'], { relativeTo: this.route });
  }

  deleteall(){
    this.clienteService.getAll().subscribe((rows) => {
      for (const element of rows) {
        this.clienteService.delete(element.id).subscribe({
          next:(response)=>{
            console.log(response);
          }
        })
      }
    });
  }

  private fetchPage(page: number, isReset: boolean, gen: number): void {
    const sub = this.clienteService.getPage({
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

  private filaExportacion(row: ClienteResponse) {
    return {
      id: row.id,
      noCliente: row.noCliente,
      nombreComercial: row.nombreComercial,
      nombreComercialAnterior: row.historialNombresComerciales?.[0] || '',
      tipoPago: row.tipoPago,
      diasDeCredito: row.diasDeCredito,
      correo: row.correo,
      telefono: row.telefono,
      fechaAlta: row.fechaAlta ? new Date(row.fechaAlta) : '',
      fechaAltaStr: this.dateTimeFormatService.format(row.fechaAlta),
      razonSocial: row.informacionFiscal?.razonSocial || '',
      razonSocialAnterior: row.historialRazonesSociales?.[0] || '',
      rfc: row.informacionFiscal?.rfc || '',
      tipoContribuyente: row.informacionFiscal?.tipoContribuyente || '',
      codigoPostal: row.informacionFiscal?.codigoPostal || '',
      tipoVialidad: row.informacionFiscal?.tipoVialidad || '',
      nombreVialidad: row.informacionFiscal?.nombreVialidad || '',
      numeroExterior: row.informacionFiscal?.numeroExterior || '',
      numeroInterior: row.informacionFiscal?.numeroInterior || '',
      colonia: row.informacionFiscal?.colonia || '',
      localidad: row.informacionFiscal?.localidad || '',
      municipio: row.informacionFiscal?.municipio || '',
      entidadFederativa: row.informacionFiscal?.entidadFederativa || '',
      calle1: row.informacionFiscal?.calle1 || '',
      calle2: row.informacionFiscal?.calle2 || '',
      tipoClienteNombre: row.tipoDeCliente?.nombre || '',
      idTipoDeCliente: row.tipoDeCliente?.idTipoCliente || '',
      createdAt: row.createdAt ? new Date(row.createdAt) : '',
      updatedAt: row.updatedAt ? new Date(row.updatedAt) : (row.createdAt ? new Date(row.createdAt) : ''),
      createdAtStr: this.dateTimeFormatService.format(row.createdAt),
      updatedAtStr: this.dateTimeFormatService.format(row.updatedAt ? row.updatedAt : row.createdAt),
      comentario: row.comentario || '',
      enabled: row.enabled,
    };
  }
}

export interface TableListCliente{
  nombreComercial:string;
  razonSocial:string;
  tipoCliente:string;
  telefono:string;
  clienteDesde:string;
  creado:string;
  modificado:string;
  id:string;
}
