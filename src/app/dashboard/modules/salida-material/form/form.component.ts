import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, DoCheck, EventEmitter, OnDestroy, Output, computed, inject, Input, OnInit, Signal, ViewChild, signal } from '@angular/core';
import { FormArray, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { SelectModel } from '@core/common/select.model';
import { AppPrimengModule } from '@shared/app-primeng/app-primeng.module';
import { AppSharedModule } from '@shared/app-shared.module';
import { MessageErrorComponent } from '@shared/components/message-error/message-error.component';
import { TipoEmpleadoApiService } from '../../tipo-empleado/services/tipo-empleado.api.service';
import { DepartamentoApiService } from '../../departamento/services/departamento.api.service';
import { DropdownModel } from '@shared/interface/dropdown.model';
import { TipoClienteApiService } from '../../tipo-cliente/services/tipo-cliente.api.service';
import { EmpleadoApiService } from '../../empleados/services/empleado.api.service';
import { ProductoResponseDto } from '../../producto/services/dtos/producto.response.dto';
import { TipoImpuestoResponseDto } from '../../tipo-impuesto/services/dtos/tipo-impuesto.response.dto';
import { Table } from 'primeng/table';
import { AlmacenResponseDto } from '../../almacen/services/dtos/almacen.response.dto';
import { AlmacenApiService } from '../../almacen/services/almacen.api.service';
import { InventarioService } from '../../inventario/services/inventario.service';
import { UnidadMedidaService } from '../../unidades-medida/service/unidad-medida.service';
import { MessageService } from 'primeng/api';
import { EmpleadoResponseDto, getEmpleadoNombreCompleto } from '../../empleados/services/dtos/empleado.response';
import { WhitelistInsumoApiService } from '../../producto/services/whitelist-insumo.api.service';
import { DialogFirmaComponent } from '@shared/components/dialog-firma/dialog-firma.component';
import { environment } from '../../../../../environments/environment';

@Component({
  selector: 'app-form',
  templateUrl: './form.component.html',
  imports:[
    MessageErrorComponent,
    ReactiveFormsModule,
    CommonModule,
    AppSharedModule,
    AppPrimengModule,
    DialogFirmaComponent,

      
  ]
  // styles: [':host{display:contents}'], // Makes component host as if it was not there, can offer less css headaches. Use @HostBinding class approach for easier overrides.
  // host: { class: 'contents' },
})
export class FormComponent implements OnInit,AfterViewInit, DoCheck, OnDestroy {

  @Input() formulario!:FormGroup;
    @ViewChild('table') table!: Table;
      messageService = inject(MessageService);
  
  // tipoEmpleadoApiService = inject(TipoEmpleadoApiService)
  // departamentoApiService = inject(DepartamentoApiService)
  tipoCliente = inject(TipoClienteApiService);
  empleadoApiService = inject(EmpleadoApiService);
  almacenApiService = inject(AlmacenApiService);
  inventarioApiService = inject(InventarioService);
  private whitelistApiService = inject(WhitelistInsumoApiService);
  unidadMedidaApiService = inject(UnidadMedidaService);
  comentarios:string = '';
  private empleadosExtra = signal<EmpleadoResponseDto[]>([]);
  private selectedEmployeeSignature = '';
  private allowedProductIds = new Set<string>();
  private allowedProductsReady = false;
      @Input() listaPartidas: SalidaMaterialPartida[] = [];
      /** Consulta de una salida guardada: el back no permite editarla, así que no se ofrecen acciones. */
      @Input() soloLectura = false;
      listaSeleccionada: any[] = [];

  // ---- Firma de quien recibe ----
  @ViewChild(DialogFirmaComponent) dialogFirma?: DialogFirmaComponent;
  /** Consulta: nombre del archivo de la firma guardada (null si la salida no tiene firma). */
  @Input() idImagenFirmaRecibe: string | null = null;
  /** Consulta: fecha/hora de la firma guardada. */
  @Input() fechaFirmaRecibe: string | null = null;
  /** Consulta: true mientras se sube la firma y se llama al PATCH. */
  @Input() firmandoRecibe = false;
  /** Registro: la firma capturada (o null si se descartó). La sube el padre al guardar. */
  @Output() firmaRecibeChange = new EventEmitter<File | null>();
  /** Consulta: firma capturada para una salida ya guardada sin firma. */
  @Output() firmarRecibe = new EventEmitter<File>();
  firmaRecibeFile: File | null = null;
  firmaRecibePreviewUrl: string | null = null;

  get nombreEmpleadoReceptor(): string {
    const id = String(this.formulario?.get('empleadoReceptor')?.value ?? '');
    if (!id) return '';
    const empleado = this.getMergedEmployees().find((row) => row.idEmpleado === id);
    return empleado ? getEmpleadoNombreCompleto(empleado) : '';
  }

  get urlFirmaRecibe(): string {
    return this.idImagenFirmaRecibe ? `${environment.apiUrl}images/${this.idImagenFirmaRecibe}` : '';
  }

  abrirFirmaRecibe(): void {
    if (!this.formulario?.get('empleadoReceptor')?.value) return;
    this.dialogFirma?.open();
  }

  onFirmaRecibeConfirmada(file: File): void {
    if (this.soloLectura) {
      this.firmarRecibe.emit(file);
      return;
    }
    this.liberarPreviewFirma();
    this.firmaRecibeFile = file;
    this.firmaRecibePreviewUrl = URL.createObjectURL(file);
    this.firmaRecibeChange.emit(file);
  }

  descartarFirmaRecibe(): void {
    const teniaFirma = this.firmaRecibeFile !== null;
    this.liberarPreviewFirma();
    this.firmaRecibeFile = null;
    if (teniaFirma) this.firmaRecibeChange.emit(null);
  }

  private liberarPreviewFirma(): void {
    if (this.firmaRecibePreviewUrl) URL.revokeObjectURL(this.firmaRecibePreviewUrl);
    this.firmaRecibePreviewUrl = null;
  }

  ngOnDestroy(): void {
    this.liberarPreviewFirma();
  }


   tipoContribuyente:DropdownModel[] = [
      {
        name:'Físico',
        code:'FISICO'
      },
      {
        name:'Moral',
        code:'MORAL'
      }
    ]
    condicionPago:DropdownModel[] = [
      {
        name:'Contado',
        code:'CONTADO'
      },
      {
        name:'Crédito',
        code:'CREDITO'
      } 
    ]

  listaEmpleadoSelecccionar: Signal<SelectModel[]> = computed(() => {
      const empleados = this.getMergedEmployees();
      if (empleados.length > 0) {
        return empleados.map((row) => ({
          label: getEmpleadoNombreCompleto(row),
          value: row.idEmpleado,
          disabled: !row.enabled,
        }));
      } else {
        return [];
      }
    });

  almacenSelecccionar: Signal<SelectModel[]> = computed(() => {
      if (this.almacenApiService.listAll().length > 0) {
        return this.almacenApiService.listAll().map((row) => ({
          label: row.nombre,
          value: row.id,
        }));
      } else {
        return [];
      }
    });

    unidadMedidaSelecccionar: Signal<SelectModel[]> = computed(() => {
      if (this.unidadMedidaApiService.listAll().length > 0) {
        return this.unidadMedidaApiService.listAll().map((row) => ({
          label: row.nombre,
          value: row.idUnidadDeMedida,
        }));
      } else {
        return [];
      }
    });

    getUnidadMedidaNombre(unidadMedida: any): string {
      if (!unidadMedida) return '';
      if (typeof unidadMedida === 'object' && unidadMedida.nombre) {
        return unidadMedida.nombre;
      }
      const id = typeof unidadMedida === 'object'
        ? unidadMedida.idUnidadDeMedida ?? unidadMedida.id
        : unidadMedida;
      return this.unidadMedidaApiService.listAll().find(
        (row) => row.idUnidadDeMedida === id
      )?.nombre ?? id ?? '';
    }

    ngOnInit(): void {
      this.empleadoApiService.getAllFilter('?enabled=true').subscribe();
      this.almacenApiService.getAll().subscribe();
      this.unidadMedidaApiService.getAll().subscribe();
    }

    ngDoCheck(): void {
      const nextSignature = String(this.formulario?.get('empleadoReceptor')?.value ?? '');
      if (nextSignature !== this.selectedEmployeeSignature) {
        this.selectedEmployeeSignature = nextSignature;
        // La firma corresponde a un empleado: si cambia quien recibe, se descarta.
        if (!this.soloLectura) this.descartarFirmaRecibe();
        this.loadMissingEmpleadoReceptor();
        this.loadAllowedProducts(nextSignature);
      }
    }

    getEmpleadoReceptorOptions(): SelectModel[] {
      const selectedId = String(this.formulario?.get('empleadoReceptor')?.value ?? '');
      return this.listaEmpleadoSelecccionar().map((option) =>
        option.value === selectedId ? { ...option, disabled: false } : option
      );
    }

    private getMergedEmployees(): EmpleadoResponseDto[] {
      const map = new Map<string, EmpleadoResponseDto>();
      for (const empleado of this.empleadoApiService.listAll()) {
        map.set(empleado.idEmpleado, empleado);
      }
      for (const empleado of this.empleadosExtra()) {
        map.set(empleado.idEmpleado, empleado);
      }
      return Array.from(map.values());
    }

    private loadMissingEmpleadoReceptor(): void {
      const id = String(this.formulario?.get('empleadoReceptor')?.value ?? '');
      if (!id || this.getMergedEmployees().some((empleado) => empleado.idEmpleado === id)) {
        return;
      }

      this.empleadoApiService.getOne(id).subscribe((empleado) => {
        this.empleadosExtra.update((list) =>
          list.some((item) => item.idEmpleado === empleado.idEmpleado)
            ? list
            : [...list, empleado]
        );
      });
    }

    private loadAllowedProducts(idEmpleado: string): void {
      this.allowedProductsReady = false;
      this.allowedProductIds.clear();
      const receptorBloqueado = this.formulario?.get('empleadoReceptor')?.disabled ?? false;
      if (receptorBloqueado) this.listaPartidas.forEach((partida) => partida.listaProducto = []);
      else this.limpiarProductosPartidas();
      if (!idEmpleado) {
        if (!receptorBloqueado) this.limpiarProductosPartidas();
        return;
      }

      this.whitelistApiService.getProductosPermitidos(idEmpleado).subscribe({
        next: (response) => {
          if (this.selectedEmployeeSignature !== idEmpleado) return;
          this.allowedProductIds = new Set((response.productos ?? []).map((producto) => producto.idProducto));
          this.allowedProductsReady = true;
          if (!receptorBloqueado) {
            this.listaPartidas.forEach((partida) => {
              const producto = partida.producto as any;
              const productoId = producto?.id ?? producto?.idProducto;
              if (productoId && !this.allowedProductIds.has(productoId)) {
                partida.producto = null;
                partida.stock = 0;
              }
            });
          }
          this.reloadProductsForPartidas();
        },
        error: () => {
          if (this.selectedEmployeeSignature !== idEmpleado) return;
          this.allowedProductsReady = true;
          if (!receptorBloqueado) this.limpiarProductosPartidas();
          this.messageService.add({ key: 'center', severity: 'error', summary: 'Error', detail: 'No se pudieron cargar los insumos permitidos para el empleado.' });
        },
      });
    }

    private limpiarProductosPartidas(): void {
      this.listaPartidas.forEach((partida) => {
        partida.listaProducto = [];
        partida.producto = null;
        partida.stock = 0;
      });
    }

    private reloadProductsForPartidas(): void {
      this.listaPartidas.forEach((partida, index) => {
        if (partida.almacen) this.getProductos(null, partida, index);
      });
    }

      ngAfterViewInit(): void {
    if (!this.soloLectura) this.agregarPartida();
  }

    get partidas(): FormArray {
  return this.formulario.get('partidas') as FormArray;
}

    agregarPartida(){
    //       this.listaPartidas.push({
    //   id: '',
    //   producto: null,
    //   cantidad: 0,
    //   tipoImpuesto: null,
    //   aplicado: null,
    //   precioUnitario: 0,
    //   precioUnitarioOriginal:0,
    //   idPrecio:'',
    //   descuento: 0,
    //   subTotal: 0,
    // });
    this.listaPartidas.push({
      id: '',
      uid: nuevaClavePartida(),
      almacen: null,
      producto: null,
      listaProducto: [],
      cantidad: 0,
      unidadMedida: null,
      stock: 0,
      comentario: '',
    })
    this.table.initRowEdit(this.listaPartidas[this.listaPartidas.length - 1]);

    }
    /**
     * Quita las partidas seleccionadas. Se modifica el mismo arreglo que recibe la pantalla
     * padre, para que lo que se guarda coincida con lo que se ve.
     */
    eliminarPartida(){
      const seleccionadas = new Set(this.listaSeleccionada);
      if (!seleccionadas.size) return;
      for (let i = this.listaPartidas.length - 1; i >= 0; i--) {
        if (seleccionadas.has(this.listaPartidas[i])) {
          this.listaPartidas.splice(i, 1);
        }
      }
      this.listaSeleccionada = [];
    }

    productos:any = []

getProductos(event: any, item: any,index:number): void {
  if (!this.allowedProductsReady) {
    this.listaPartidas[index].listaProducto = [];
    return;
  }
  const idAlmacen = typeof item.almacen === 'object'
    ? item.almacen.id ?? item.almacen.idAlmacen
    : item.almacen;
  this.inventarioApiService.getAllFilter('?idAlmacen=' + idAlmacen).subscribe((resp) => {
    const partida = this.listaPartidas[index];
    if (!partida) return;

    partida.listaProducto = resp.filter((element: any) =>
    this.allowedProductIds.has(element.producto?.idProducto)
  ).map((element: any) => ({
      label: element.producto.nombre,
      value: {
        ...element.producto,
        id: element.producto.idProducto,
        stock: element.cantidad,
        unidadMedidaDefault: element.producto.unidadMedidaDefault
          ?? element.producto.unidadesMedida
          ?? element.unidadesMedida
      }
    }));

    const productoId = (partida.producto as any)?.id ?? partida.producto?.idProducto;
    const inventarioActual = resp.find((element: any) => element.producto?.idProducto === productoId);
    partida.stock = inventarioActual?.cantidad ?? 0;
  });
}

setProducto(event: any, item: any, index: number): void {
  const almacenId = item.almacen;
  const productoSeleccionado = event.value; // este es el objeto `{ id, stock }`

  const productoId = productoSeleccionado?.id;

  // Validar si ya existe esa combinación en otra partida
  const combinacionExiste = this.listaPartidas.some((p, i) =>
    i !== index &&
    p.almacen === almacenId &&
    p.producto?.id === productoId
  );

  if (combinacionExiste) {
    // NO dejar que se seleccione el producto
    item.producto = '';
    item.stock = 0;
      this.messageService.add({
        key: 'center',
        severity: 'warn',
        summary: '!Error!',
        detail: 'Ya existe una partida con esta combinación de almacén y producto..',
      });
    return;
  }

  // Si no existe, permitir selección y asignar stock
  item.producto = productoSeleccionado;
  item.stock = productoSeleccionado?.stock ?? 0;
  item.unidadMedida = productoSeleccionado?.unidadMedidaDefault?.idUnidadDeMedida
    ?? productoSeleccionado?.unidadMedidaDefault?.id
    ?? productoSeleccionado?.unidadMedida
    ?? null;
}


}


export interface SalidaMaterialPartida{
  id: string;
  /** Clave solo para la tabla: las partidas nuevas aún no tienen id y todas compartirían ''. */
  uid?: string;
  almacen: AlmacenResponseDto | null;
  producto: ProductoResponseDto | null;
  listaProducto:{label:string, value:any}[];
  cantidad: number;
  unidadMedida: any | null;
  stock: number;
  comentario: string;
}

let contadorPartidas = 0;
/** Clave única por partida para la tabla (selección y edición por fila). */
export function nuevaClavePartida(): string {
  contadorPartidas += 1;
  return `partida-${Date.now().toString(36)}-${contadorPartidas}`;
}
