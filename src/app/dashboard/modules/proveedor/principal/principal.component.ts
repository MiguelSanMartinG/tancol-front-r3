import {
  Component,
  computed,
  ContentChild,
  ContentChildren,
  inject,
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
import { StatusBinaryReadOnlyComponent } from '@shared/components/status-binary-read-only/status-binary-read-only.component';
import { ProveedorResponseDto } from '../services/dtos/proveedor.response.dto';
import { EliminarComponent } from '../eliminar/eliminar.component';
import { ActivatedRoute, Router } from '@angular/router';
import { ImportFileComponent } from '@shared/components/import-file/import-file.component';
import { TipoClienteResponse } from '../../tipo-cliente/services/tipo-cliente-response';
import { TipoProveedorResponseDto } from '../../tipo-proveedor/services/dtos/tipo-proveedor.response.dto';
import { TipoProveedorApiService } from '../../tipo-proveedor/services/tipo-proveedor.api.service';
import { TipoProveedorCreateDto } from '../../tipo-proveedor/services/dtos/tipo-proveedor.create.dto';
import { CommonModule } from '@angular/common';
import { DateTimeFormatService } from '@shared/services/date-time-format.service';

@Component({
  selector: 'app-principal',
  imports: [
    BotonRegresarComponent,
    HeaderComponent,
    AppPrimengModule,
    RegistrarProveedorComponent,
    EditarComponent,
    DatetimePipe,
    StatusBinaryReadOnlyComponent,
    EliminarComponent,
    ImportFileComponent,
    CommonModule
  ],
  templateUrl: './principal.component.html',
  styleUrl: './principal.component.scss',
})
export class PrincipalComponent implements OnInit {
  update = false;
  proveedorApiService = inject(ProveedorApiService);
    tipoProveedorApiService = inject(TipoProveedorApiService);
  
  @ViewChild(RegistrarProveedorComponent) registrarComponent!: RegistrarProveedorComponent;
  @ViewChild(EditarComponent) editarComponent!: EditarComponent;
  @ViewChild(EliminarComponent) eliminarComponent!: EliminarComponent;
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
    private dateTimeFormatService: DateTimeFormatService
  ) {

      this.tipoProveedorApiService.getAll().subscribe(data =>{
        const catalogoTipoProveedor = data.map((item:any)=>({
          label:item.nombre,
          value:item.id
        }));
        this.catalogoProveedorService = {
          create: (data:TipoProveedorCreateDto) => this.tipoProveedorApiService.create(data)
        }
        console.log(catalogoTipoProveedor);

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

  listaRegistros = computed(() => {
    const data = this.proveedorApiService.listProveedor();
    if (data.length > 0) {
      return data.map((row) => ({
        ...row,
        nombresTiposProveedor: row.tiposProveedor?.map(tipo => tipo.nombre).join(', ') || row.nombreTipoProveedor || '',
        ...(row.infoFiscal ?? {}),
        createdAt: new Date(row.createdAt),
        updatedAt: new Date(row.updatedAt),
        createdAtStr: this.dateTimeFormatService.format(row.createdAt),
        updatedAtStr: this.dateTimeFormatService.format(row.updatedAt ?? row.createdAt),
      }));
    }
    return [];
  });
  ngOnInit(): void {
    this.proveedorApiService.getAll().subscribe();



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
  searchTable(tableComponent: any, $event: any) {
    tableComponent.filterGlobal($event.target!.value ?? '', 'contains');
  }
}
