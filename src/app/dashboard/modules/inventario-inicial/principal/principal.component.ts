import {
  Component,
  computed,
  inject,
  OnInit,
  ViewChild,
} from '@angular/core';
import { AppPrimengModule } from '@shared/app-primeng/app-primeng.module';
import { BotonRegresarComponent } from '@shared/components/boton-regresar/boton-regresar.component';
import { HeaderComponent } from '@shared/components/header/header.component';
import { FormsModule } from '@angular/forms';
import { ImportFileComponent } from "../../../../shared/components/import-file/import-file.component";
import { RegistrarAlmacenComponent } from '../../almacen/registrar/registrar.component';
import { AlmacenApiService } from '../../almacen/services/almacen.api.service';
import { InventarioInicialService } from '../services/inventario-inicial.service';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { InventarioInicialResponse } from '../services/inventario-inicia.response';
import { EditarComponent } from '../editar/editar.component';
import { EliminarComponent } from '../eliminar/eliminar.component';
import { AlmacenResponseDto } from '../../almacen/services/dtos/almacen.response.dto';
import { ProductoResponseDto } from '../../producto/services/dtos/producto.response.dto';
import { UnidadMedidaResponse } from '../../unidades-medida/service/unidad-medida.response';
import { ProductoApiService } from '../../producto/services/producto.api.service';
import { ProductoCreateDto } from '../../producto/services/dtos/producto.create.dto';
import { AlmacenCreateDto } from '../../almacen/services/dtos/almacen.create.dto';
import { UnidadMedidaService } from '../../unidades-medida/service/unidad-medida.service';
import { UnidadMedidaDTO } from '../../unidades-medida/service/unidad-medida.dto';
import { ProveedorApiService } from '../../proveedor/services/proveedor.api.service';
import { ProveedorResponseDto } from '../../proveedor/services/dtos/proveedor.response.dto';
import { ProveedorCreateDto } from '../../proveedor/services/dtos/proveedor.create.dto';
import { DateTimeFormatService } from '@shared/services/date-time-format.service';
import { DatetimePipe } from '@shared/pipes/datetime.pipe';

@Component({
  selector: 'app-principal',
  imports: [
    BotonRegresarComponent,
    HeaderComponent,
    AppPrimengModule,
    EliminarComponent,
    FormsModule,
    ImportFileComponent,
    CommonModule,
    DatetimePipe
],
  templateUrl: './principal.component.html',
  styleUrl: './principal.component.scss',
})
export class PrincipalComponent implements OnInit {
  update = false;
  inventarioInicialApiService = inject(InventarioInicialService)
  almacenApiService = inject(AlmacenApiService);
  productoApiService = inject(ProductoApiService);
  unidadMedidaApiService = inject(UnidadMedidaService);
  proveedorApiService = inject(ProveedorApiService)
  @ViewChild(RegistrarAlmacenComponent)
  registrarComponent!: RegistrarAlmacenComponent;
  @ViewChild(EditarComponent) editarComponent!: EditarComponent;
  @ViewChild(EliminarComponent) eliminarComponent!: EliminarComponent;
  listaSeleccionada: any[] = [];
configurationImport = {
  service:null,
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
      createField: 'nombre', // 👈 importante
  catalogValues: [],
  service:null,
    getId: (result: AlmacenResponseDto) => result.id // 👈 aquí defines cómo extraer el id

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
      createField: 'nombre', // 👈 importante
  catalogValues: [],
  service:null,
    getId: (result: ProductoResponseDto) => result.id // 👈 aquí defines cómo extraer el id

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
      createField: 'nombre', // 👈 importante
  catalogValues: [],
  service:null,
    getId: (result: UnidadMedidaResponse) => result.idUnidadDeMedida // 👈 aquí defines cómo extraer el id

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
      createField: 'nombre', // 👈 importante
  catalogValues: [],
  service:null,
    getId: (result: ProveedorResponseDto) => result.idProveedor // 👈 aquí defines cómo extraer el id

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
  listaRegistros = computed(() => {
    if (this.inventarioInicialApiService.listAll().length > 0) {
      return [
        ...this.inventarioInicialApiService.listAll().map((row) => ({
          ...row,
          createdAt: new Date(row.createdAt),
          updatedAt: row.updatedAt ? new Date(row.updatedAt) : new Date(row.createdAt),
          createdAtStr: this.dateTimeFormatService.format(row.createdAt),
          updatedAtStr: this.dateTimeFormatService.format(
            row.updatedAt ? row.updatedAt : row.createdAt
          ),
        })),
      ];
    }
    return [];
  });





    constructor(
      private router:Router,
      private route: ActivatedRoute,
      private dateTimeFormatService: DateTimeFormatService
    ){
    //Almacen------------------------------------
    this.almacenApiService.getAll().subscribe(data => {
    const catalogoAlmacen = data.map((item) => ({
      label: item.nombre,  // o el campo correcto que quieras mostrar
      value: item.id    // o el campo id del backend
    }));
    let catalogoAlmacenService = {
    create: (data: AlmacenCreateDto) => this.almacenApiService.create(data)
    };

  // Asignar el catálogo en la configuración del importador
  const propiedadTipoCliente:any = this.configurationImport.properties.find(p => p.nameProperty === 'idAlmacen');
  if (propiedadTipoCliente) {
    propiedadTipoCliente.catalogValues = catalogoAlmacen;
    propiedadTipoCliente.service = catalogoAlmacenService;
    console.log('this.configurationImport',this.configurationImport);
  }
  });
  //Producto-------------------------------------
    this.productoApiService.getAll().subscribe(data => {
    const catalogoProducto = data.map((item) => ({
      label: item.nombre,  // o el campo correcto que quieras mostrar
      value: item.idProducto    // o el campo id del backend
    }));
    let catalogoProductoService = {
    create: (data: ProductoCreateDto) => this.productoApiService.create(data)
    };

  // Asignar el catálogo en la configuración del importador
  const propiedadTipoCliente:any = this.configurationImport.properties.find(p => p.nameProperty === 'idProducto');
  if (propiedadTipoCliente) {
    propiedadTipoCliente.catalogValues = catalogoProducto;
    propiedadTipoCliente.service = catalogoProductoService;
    console.log('this.configurationImport',this.configurationImport);
  }
  });
  //UnidadMedida----------------------------------------
      this.unidadMedidaApiService.getAll().subscribe(data => {
    const catalogoUnidadMedida = data.map((item) => ({
      label: item.nombre,  // o el campo correcto que quieras mostrar
      value: item.idUnidadDeMedida    // o el campo id del backend
    }));
    let catalogoUnidadMedidaService = {
    create: (data: UnidadMedidaDTO) => this.unidadMedidaApiService.create(data)
    };

  // Asignar el catálogo en la configuración del importador
  const propiedadTipoCliente:any = this.configurationImport.properties.find(p => p.nameProperty === 'unidadDeMedida');
  if (propiedadTipoCliente) {
    propiedadTipoCliente.catalogValues = catalogoUnidadMedida;
    propiedadTipoCliente.service = catalogoUnidadMedidaService;
    console.log('this.configurationImport',this.configurationImport);
  }
  });
  //Proveedor------------------------------------------------
      this.proveedorApiService.getAll().subscribe(data => {
    const catalogoProveedor = data.map((item) => ({
      label: item.nombreComercial,  // o el campo correcto que quieras mostrar
      value: item.idProveedor    // o el campo id del backend
    }));
    let catalogoProveedorService = {
    create: (data: ProveedorCreateDto) => this.proveedorApiService.create(data)
    };

  // Asignar el catálogo en la configuración del importador
  const propiedadTipoCliente:any = this.configurationImport.properties.find(p => p.nameProperty === 'idProveedor');
  if (propiedadTipoCliente) {
    propiedadTipoCliente.catalogValues = catalogoProveedor;
    propiedadTipoCliente.service = catalogoProveedorService;
    console.log('this.configurationImport',this.configurationImport);
  }
  });

  this.configurationImport.service = <any> this.inventarioInicialApiService




    }

  ngOnInit(): void {
    this.inventarioInicialApiService.getAll().subscribe();
  }
  displayCreate() {
    this.router.navigate(['../crear'], { relativeTo: this.route });
  }
    displayUpdate(itemDto: InventarioInicialResponse) {
      this.router.navigate(['../actualizar/',itemDto.idInventario], { relativeTo: this.route });
  
    }
    displayDelete(itemDto: InventarioInicialResponse) {
      this.eliminarComponent.itemDto.set({
        ...itemDto
      });
      this.eliminarComponent.display = true;
    }
  searchTable(tableComponent: any, $event: any) {
    tableComponent.filterGlobal($event.target!.value ?? '', 'contains');
  }
}
