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
import { FormsModule } from '@angular/forms';
import { AppPrimengModule } from '@shared/app-primeng/app-primeng.module';
import { BotonRegresarComponent } from '@shared/components/boton-regresar/boton-regresar.component';
import { HeaderComponent } from '@shared/components/header/header.component';
import { EditarComponent } from '../editar/editar.component';
import { RegistrarProductoComponent } from '../registrar/registrar.component';
import { ProductoApiService, ProductoStockReviewResponse } from '../services/producto.api.service';
import { DatetimePipe } from '@shared/pipes/datetime.pipe';
import { StatusBinaryReadOnlyComponent } from '@shared/components/status-binary-read-only/status-binary-read-only.component';
import { ProductoResponseDto } from '../services/dtos/producto.response.dto';
import { EliminarComponent } from '../eliminar/eliminar.component';
import { CommonModule } from '@angular/common';
import { ImportFileComponent } from '@shared/components/import-file/import-file.component';
import { CategoriaProductoResponseDto } from '../../categoria-producto/services/dtos/categoria-producto.response.dto';
import { CategoriaProductoApiService } from '../../categoria-producto/services/categoria-producto.api.service';
import { CategoriaProductoCreateDto } from '../../categoria-producto/services/dtos/categoria-producto.create.dto';
import { UnidadMedidaResponse } from '../../unidades-medida/service/unidad-medida.response';
import { UnidadMedidaService } from '../../unidades-medida/service/unidad-medida.service';
import { UnidadMedidaDTO } from '../../unidades-medida/service/unidad-medida.dto';
import { MessageService } from 'primeng/api';
import { ActivatedRoute } from '@angular/router';
import { catchError, forkJoin, map, of } from 'rxjs';
import { DepartamentoApiService } from '../../departamento/services/departamento.api.service';
import { WhitelistInsumoApiService } from '../services/whitelist-insumo.api.service';

@Component({
  selector: 'app-principal',
  imports: [
    BotonRegresarComponent,
    HeaderComponent,
    AppPrimengModule,
    RegistrarProductoComponent,
    EditarComponent,
    DatetimePipe,
    StatusBinaryReadOnlyComponent,
    EliminarComponent,
    CommonModule,
    ImportFileComponent,
    FormsModule,
  ],
  templateUrl: './principal.component.html',
  styleUrl: './principal.component.scss',
})
export class PrincipalComponent implements OnInit {
  update = false;
  productoApiService = inject(ProductoApiService);
  categoriaProductoApiService = inject(CategoriaProductoApiService)
  @ViewChild(RegistrarProductoComponent) registrarComponent!: RegistrarProductoComponent;
  @ViewChild(EditarComponent) editarComponent!: EditarComponent;
  @ViewChild(EliminarComponent) eliminarComponent!: EliminarComponent;
  unidadMedidaApiService = inject(UnidadMedidaService);
  private messageService = inject(MessageService);
  private route = inject(ActivatedRoute);
  private departamentoApiService = inject(DepartamentoApiService);
  private whitelistApiService = inject(WhitelistInsumoApiService);
  stockReview: ProductoStockReviewResponse | null = null;
  stockReviewVisible = false;
  reviewingStock = false;
  usarWhitelist = false;
  loadingWhitelistConfig = true;
  savingWhitelist = false;
  asignacionDepartamentosVisible = false;
  asignandoDepartamentos = false;
  productoParaAsignacion: ProductoResponseDto | null = null;
  departamentosSeleccionados: string[] = [];
  departamentosDisponibles: Array<{ label: string; value: string }> = [];
  
  configurationImport = {
    service:null,
    properties: [
      {
        nameProperty: 'nombre',
        label: 'Nombre',
        column: '',
        unique: true,
        id: false,
        required: true,
        type: 'text',
      },
      {
        nameProperty: 'sku',
        label: 'SKU',
        column: '',
        unique: true,
        id: false,
        required: true,
        type: 'text',
      },
      {
        nameProperty: 'alias',
        label: 'Alias',
        column: '',
        unique: false,
        id: false,
        required: true,
        type: 'text',
      },
      {
        nameProperty: 'categoriaProductoId',
        label: 'Categoria Insumo',
        column: '',
        id: true,
        unique: false,
        serviceName: 'CategoriaProductoApiService',
        query: '?nombre=',
        required: true,
        type: 'catalog',
          createField: 'nombre', // 👈 importante
    catalogValues: [],
    service:null,
      getId: (result: CategoriaProductoResponseDto) => result.id // 👈 aquí defines cómo extraer el id
  
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
        nameProperty: 'descripción',
        label: 'Descripción',
        column: '',
        required: false,
        id: false,
        type: 'text',
      }
    ],
    titleDownload: 'Insumos',
  };
  catalogoProveedorService:any

  constructor(){
          this.categoriaProductoApiService.getAll().subscribe(data =>{
            const catalogoTipoProveedor = data.map((item:CategoriaProductoResponseDto)=>({
              label:item.nombre,
              value:item.idCategoria
            }));
            this.catalogoProveedorService = {
              create: (data:CategoriaProductoCreateDto) => this.categoriaProductoApiService.create(data)
            }
            console.log(catalogoTipoProveedor);
    
      // Asignar el catálogo en la configuración del importador
      const propiedadTipoProveedor:any = this.configurationImport.properties.find(p => p.nameProperty === 'categoriaProductoId');
      if (propiedadTipoProveedor) {
        propiedadTipoProveedor.catalogValues = catalogoTipoProveedor;
        propiedadTipoProveedor.service = this.catalogoProveedorService;
        console.log('this.configurationImport',this.configurationImport);
      }
    
    
    
    
    
          })
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
      this.configurationImport.service = <any> this.productoApiService
  }

  listaRegistros = computed( ()=> {
    if(this.productoApiService.listProducto().length > 0){
      return [...this.productoApiService.listProducto().map( row => ({
        ...row,
        updatedAt: row.updatedAt ?? ''
      }))]
    }
    return [];
  })
  ngOnInit(): void {
    this.whitelistApiService.getConfiguracion().subscribe({
      next: (config) => {
        this.usarWhitelist = config.usarWhitelist;
        this.loadingWhitelistConfig = false;
      },
      error: () => {
        this.loadingWhitelistConfig = false;
        this.messageService.add({ key: 'center', severity: 'error', summary: 'Error', detail: 'No se pudo cargar la configuración de whitelist.' });
      },
    });
    this.departamentoApiService.getAllFilter().subscribe({
      next: (departamentos) => this.departamentosDisponibles = departamentos
        .filter((departamento) => departamento.status)
        .map((departamento) => ({ label: departamento.nombre, value: departamento.idDepartamento })),
      error: () => this.messageService.add({ key: 'center', severity: 'error', summary: 'Error', detail: 'No se pudieron cargar los departamentos.' }),
    });
    this.route.queryParamMap.subscribe((params) => {
      const productoId = params.get('productoId');
      this.productoApiService.getAll().subscribe((items) => {
        const producto = items.find((item) => item.idProducto === productoId);
        if (producto) this.displayUpdate(producto);
      });
    });
  }
  displayUpdate(itemDto: ProductoResponseDto) {
    console.log(itemDto);
    this.editarComponent.itemDto.set({
      ...itemDto
    });
    this.editarComponent.display = true;
  }
  displayDelete(itemDto: ProductoResponseDto) {
    this.eliminarComponent.itemDto.set({
      ...itemDto
    });
    this.eliminarComponent.display = true;
  }
  displayCreate() {
    this.registrarComponent.display = true;
  }
  actualizarWhitelist(event: Event) {
    const checked = (event.target as HTMLInputElement).checked;
    const anterior = this.usarWhitelist;
    this.usarWhitelist = checked;
    this.savingWhitelist = true;
    this.whitelistApiService.actualizarConfiguracion(checked).subscribe({
      next: (config) => {
        this.usarWhitelist = config.usarWhitelist;
        this.messageService.add({ key: 'top-right', severity: 'success', summary: 'Configuración actualizada', detail: config.usarWhitelist ? 'Los empleados solo podrán solicitar insumos permitidos.' : 'Se permiten todos los insumos activos.' });
      },
      error: (error) => {
        this.savingWhitelist = false;
        this.usarWhitelist = anterior;
        this.messageService.add({ key: 'center', severity: 'error', summary: 'No se pudo actualizar', detail: this.errorMessage(error, 'No se pudo cambiar la whitelist.') });
      },
      complete: () => this.savingWhitelist = false,
    });
  }
  abrirAsignacionDepartamentos(producto: ProductoResponseDto) {
    this.productoParaAsignacion = producto;
    this.departamentosSeleccionados = [];
    this.asignacionDepartamentosVisible = true;
  }
  asignarDepartamentos() {
    if (!this.productoParaAsignacion || !this.departamentosSeleccionados.length) {
      this.messageService.add({ key: 'center', severity: 'warn', summary: 'Faltan datos', detail: 'Selecciona al menos un departamento.' });
      return;
    }

    this.asignandoDepartamentos = true;
    forkJoin(this.departamentosSeleccionados.map((idDepartamento) =>
      this.whitelistApiService.asignarDepartamento({
        idDepartamento,
        idProductos: [this.productoParaAsignacion!.idProducto],
        reemplazar: false,
      }).pipe(
        map(() => ({ idDepartamento, success: true as const })),
        catchError((error) => of({ idDepartamento, success: false as const, error }))
      )
    )).subscribe((results) => {
      this.asignandoDepartamentos = false;
      const fallidos = results.filter((result) => !result.success);
      if (!fallidos.length) {
        this.asignacionDepartamentosVisible = false;
        this.messageService.add({ key: 'top-right', severity: 'success', summary: 'Asignación completa', detail: `El insumo se agregó a los empleados de ${results.length} departamento(s).` });
        return;
      }

      const nombresFallidos = fallidos.map(({ idDepartamento }) =>
        this.departamentosDisponibles.find((item) => item.value === idDepartamento)?.label ?? idDepartamento
      ).join(', ');
      const exitosos = results.length - fallidos.length;
      const primerError = 'error' in fallidos[0] ? fallidos[0].error : null;
      const detalleError = this.errorMessage(primerError, 'No se pudo actualizar uno o más departamentos.');
      this.messageService.add({
        key: 'center',
        severity: exitosos ? 'warn' : 'error',
        summary: exitosos ? 'Asignación parcial' : 'No se pudo asignar',
        detail: `${exitosos} de ${results.length} departamento(s) actualizados. Revisa: ${nombresFallidos}. ${detalleError}`,
      });
    });
  }
  cerrarAsignacionDepartamentos() {
    if (this.asignandoDepartamentos) return;
    this.asignacionDepartamentosVisible = false;
  }
  private errorMessage(error: any, fallback: string): string {
    const body = error?.error;
    return String((typeof body === 'string' ? body : body?.message) || error?.message || fallback);
  }
  revisarStockMinimo() {
    this.reviewingStock = true;
    this.productoApiService.revisarStockMinimo().subscribe({
      next: (result) => { this.stockReview = result; this.stockReviewVisible = true; this.reviewingStock = false; },
      error: () => { this.reviewingStock = false; this.messageService.add({ key: 'center', severity: 'error', summary: 'Error', detail: 'No se pudo revisar el stock mínimo.' }); }
    });
  }
  searchTable(tableComponent: any, $event: any){
    tableComponent.filterGlobal($event.target!.value ?? '', 'contains')
  }

     deleteall(){
    for (const element of this.listaRegistros()) {
      this.productoApiService.delete(element.idProducto).subscribe({
        next:(response)=>{
          console.log(response);
        }
      })
    }
  }
}
