import { TipoImpuestoResponseDto } from './../../tipo-impuesto/services/dtos/tipo-impuesto.response.dto';
import { AfterViewInit, Component, inject, OnInit, QueryList, ViewChild, ViewChildren } from '@angular/core';
import { BotonRegresarComponent } from '../../../../shared/components/boton-regresar/boton-regresar.component';
import { HeaderComponent } from '../../../../shared/components/header/header.component';
import { AppPrimengModule } from '@shared/app-primeng/app-primeng.module';
import { EliminarComponent } from '../../departamento/eliminar/eliminar.component';
import { DialogEliminarTodoComponent } from '../../../../shared/components/dialog-eliminar-todo/dialog-eliminar-todo.component';
import { OrdenApiService } from '../services/solicitud-compra.api.service';
import { FormBuilder, NgModel, Validators } from '@angular/forms';
import { ProveedorApiService } from '../../proveedor/services/proveedor.api.service';
import { AppSharedModule } from '@shared/app-shared.module';
import { ProductoApiService } from '../../producto/services/producto.api.service';
import { TipoImpuestoApiService } from '../../tipo-impuesto/services/tipo-impuesto.api.service';
import { ProductoResponseDto } from '../../producto/services/dtos/producto.response.dto';
import { Table } from 'primeng/table';
import { v4 as uuidv4 } from 'uuid';
import { ActivatedRoute, Router } from '@angular/router';
import { DialogCambioPrecioComponent } from '../dialog-cambio-precio/dialog-cambio-precio.component';
import { DialogConfirmComponent } from '@shared/components/dialog-confirm/dialog-confirm.component';
import { DialogOptionComponent } from '@shared/components/dialog-option/dialog-option.component';
import { OrdenResponseDto } from '../services/dtos/solicitud-compra.response.dto';

@Component({
  selector: 'app-actualizar-solicitud-compra',
  imports: [
    BotonRegresarComponent,
    HeaderComponent,
    AppPrimengModule,
    EliminarComponent,
    DialogEliminarTodoComponent,
    AppSharedModule,
    DialogCambioPrecioComponent,
    DialogConfirmComponent,
    DialogOptionComponent,
  ],
  templateUrl: './actualizar-solicitud-compra.component.html',
  styleUrl: './actualizar-solicitud-compra.component.scss',
})
export class ActualizarSolicitudCompraComponent implements OnInit {
  router = inject(Router);
  route = inject(ActivatedRoute);
  @ViewChild('table') table!: Table;
  solicitudCompraApiService = inject(OrdenApiService);
  apiProveedores = inject(ProveedorApiService);
  apiTipoImpuesto = inject(TipoImpuestoApiService);
  apiProductos = inject(ProductoApiService);
  fb = inject(FormBuilder);
  formulario = this.fb.group({
    proveedor: ['',[Validators.required]],
    razonSocial: [
      {
        value: '',
        disabled: true,
      },
    ],
    fechaSolicitud: [new Date().toISOString(),[Validators.required]],
    prioridad: ['MEDIA'],
    titulo: ['',[Validators.required]],
  });
  @ViewChild(EliminarComponent) eliminarComponent!: EliminarComponent;
  listaSeleccionada: any[] = [];
  listaPartidas: {
    id: any
    producto: ProductoResponseDto | null,
    cantidad: number,
    tipoImpuesto: TipoImpuestoResponseDto | null,
    aplicado: null,
    precioUnitario: number,
    precioUnitarioOriginal:number,
    idPrecio:string;
    descuento: number,
    subTotal: number
  }[] = [];
  
  @ViewChild('cambioPrecio') cambioPrecio!:DialogCambioPrecioComponent;
  @ViewChild('dialogConfirm') dialogConfirm!:DialogConfirmComponent;
  @ViewChild('dialogOption') dialogOption!:DialogOptionComponent;
  @ViewChild('dialogAlerta') dialogAlerta!:DialogConfirmComponent;
  @ViewChildren(NgModel) modelos!: QueryList<NgModel>;

  idSolicitudCompra!:string;
  solicitudCompra!:OrdenResponseDto;

  constructor(){
    this.route.paramMap.subscribe( params => {
      this.idSolicitudCompra = params.get('id')!;
      this.getSolicitudCompra();
    });
  }
  
  getSolicitudCompra(){
    this.solicitudCompraApiService.getOne(this.idSolicitudCompra).subscribe( res => {
      console.log(res);
      this.solicitudCompra = res;

      if (res) {
        this.formulario.patchValue({
          proveedor: res.proveedor.idProveedor,
          razonSocial:res.proveedor.infoFiscal.razonSocial,
          fechaSolicitud: <any> new Date(res.fechaCreacionSolicitud),
          prioridad: res.prioridad,
          titulo: (res.titulo)?res.titulo:'',
        }); 
        

      }
      // this.findRazonSocial();


      for(const partida of res.partidas){
        this.cargarPartidad(partida);

      }
    });
  }

  cargarPartidad(partida: any){
    console.log(partida);

      this.listaPartidas.push({
    id: partida.idPartida,
    producto: partida.producto,
    cantidad: partida.cantidad,
    tipoImpuesto: partida.tipoImpuesto,
    aplicado: partida.impuestoAplicado,
    precioUnitario: partida.precioProveedor.precio,
    precioUnitarioOriginal:partida.precioProveedor.precio,
    idPrecio:partida.precioProveedor.idPrecio,
    descuento: partida.descuentoAplicado,
    subTotal: ((partida.cantidad*partida.precioProveedor.precio)+partida.impuestoAplicado) - partida.descuentoAplicado
  })
    
    // this.listaPartidas.push({
    //   cantidad: partida.cantidad,
    //   descuento: partida.descuento,
    //   id: partida.id,
    //   precioUnitario: partida.precio,
    //   producto: partida.producto,
    //   subTotal: 0,
    //   tipoImpuesto: partida.tipoImpuesto,
    // });


    this.table.initRowEdit(this.listaPartidas[this.listaPartidas.length - 1]);
  }

  ngOnInit(): void {
    this.apiProveedores.getAll().subscribe();
    this.solicitudCompraApiService.getAllPrioridades().subscribe();
    this.apiProductos.getAll().subscribe();
    this.apiTipoImpuesto.getAll().subscribe();
  }



  ngAfterViewInit(): void {
    // this.addPartidad();
  }
  addPartidad(){
    this.listaPartidas.push({
      id: null,
      producto: null,
      cantidad: 0,
      tipoImpuesto: null,
      aplicado: null,
      precioUnitario: 0,
      precioUnitarioOriginal:0,
      idPrecio:'',
      descuento: 0,
      subTotal: 0,
    });
    this.table.initRowEdit(this.listaPartidas[this.listaPartidas.length - 1]);
  }
  findRazonSocial() {
    const id = this.formulario.get('proveedor')?.value;
    const proveedor = this.apiProveedores
      .listProveedor()
      .find((row) => row.idProveedor == id!);
    this.formulario.get('razonSocial')?.setValue(proveedor?.infoFiscal.razonSocial!);

    console.log(this.listaPartidas);
    this.listaPartidas.forEach(element => {
      this.getPrecioProducto(element)
    });

  }
  getPrecioProducto(item: any){
    const id = this.formulario.get('proveedor')?.value;
    if (!id) {
      this.dialogAlerta.display = true;
      this.dialogAlerta.icon = 'fa-solid fa-triangle-exclamation';
      this.dialogAlerta.labelBtn = 'Cerrar'
      this.dialogAlerta.title = 'Atención';
      this.dialogAlerta.description = 'Selecciona primero un proveedor';
      this.listaPartidas.forEach((value, index, array) => {
        console.log(value);
        // value.producto = <any>{};
        value.producto = null;
      });
      this.modelos.forEach(modelo => modelo.control.updateValueAndValidity());
      const partidas  = [...this.listaPartidas];
      this.listaPartidas = []
      setTimeout(() => {
        this.listaPartidas = [...partidas];

      }, 50);

      // this.cdr.detectChanges(); // Fuerza que Angular actualice la vista

      // const partidas = [...this.listaPartidas]

      // this.listaPartidas = [];
      // setTimeout(() => {
      //   this.listaPartidas = [...partidas]

      // }, 100);

      // console.log('lista select',this.listaSeleccionada);
      // console.log('listaPartidas',this.listaPartidas);
      return;
    }
    console.log('form',this.formulario);
    console.log('producto',item);
    this.solicitudCompraApiService.getPrecioProducto({
      idProveedor: id!,
      idProducto: item.producto.idProducto
      // idPrecio: item.
    }).subscribe( res => {
      console.log(res);
      item.precioUnitario = res.precio;
      item.precioUnitarioOriginal = res.precio;
      item.idPrecio = res.idPrecio;
    })
  }
  setPrecio(item: any, event: any){
    if (item.precioUnitario !== item.precioUnitarioOriginal) {
      console.log('el valor cambio se actualizara el precio');
      console.log('form',this.formulario);
      console.log('partida',item);
      this.cambioPrecio.display = true;
      this.cambioPrecio.productName = item.producto.nombre;
      this.cambioPrecio.originalPrice = '$'+item.precioUnitarioOriginal;
      this.cambioPrecio.newPrice = '$'+item.precioUnitario;
      this.cambioPrecio.partidaId = item.id;
      // this.solicitudCompraApiService.setPrecioProducto({
      //   idPrecio: item.idPrecio,
      //   precio: item.precioUnitario
      // }).subscribe( res => {
      //   item.precio = res.precio;
      // })

    }else{
      console.log('el valor es igual');
    }


    console.log(event.target.value);

    return;
    // const id = this.formulario.get('proveedor')?.value;
    // this.solicitudCompraApiService.setPrecioProducto({
    //   idProveedor: id!,
    //   idProducto: item.producto.id,
    //   precio: event.target.value
    // }).subscribe( res => {
    //   item.precio = res.precio;
    // })
  }
  deleteAll() {
    for (const item of this.listaSeleccionada) {
      this.listaPartidas = this.listaPartidas.filter(row => row.id != item.id);
    }
    this.listaSeleccionada = [];
  }
  calcularIva(
    precioUnitario: number,
    cantidad: number,
    porcentajeImpuesto: number
  ) {
    const result = ((precioUnitario / 100) * porcentajeImpuesto) * cantidad;
    return isNaN(result) ? 0 : result;
  }
  calcularSubtotal(item: any){
    const iva = this.calcularIva(item.precioUnitario,item.cantidad, item.tipoImpuesto?.porcentaje);
    const descuento = item.descuento;
    const subtotal = item.cantidad * item.precioUnitario;
    return iva + subtotal - descuento;
  }
  calcularDescuentoTotal(){
    let suma = 0;
    for(const partida of this.listaPartidas){
      suma+=partida.descuento;
    }
    return suma;
  }
  calcularTotal(){
    let sumaTotal = 0;
    for(const partida of this.listaPartidas){
      sumaTotal+=this.calcularSubtotal(partida);
    }
    return sumaTotal;
  }
  validarRegistros(){
    if(!this.formulario.valid){
      this.formulario.markAllAsTouched();
    }
    for(const partida of this.listaPartidas){
      console.log(partida);
      if(partida.producto && partida.tipoImpuesto && partida.cantidad > 0 && partida.precioUnitario){
        continue;
      }
      alert('No estan completados los registros de partida')
      return;
    }
    this.submit('PENDIENTE');
  }
  submit(estatus: 'PENDIENTE' | 'BORRADOR'){
    const {
      fechaSolicitud,
      prioridad,
      proveedor,
      titulo
    } = this.formulario.getRawValue();

    this.solicitudCompraApiService.update({
      fechaCreacionSolicitud: fechaSolicitud!,
        partidas: this.listaPartidas.map( row => {
          console.log(row)
          return {
            cantidad: row.cantidad,
            descuentoAplicado: row.descuento,
            idProducto: row.producto?.idProducto!,
            idPartida: row.id,
            idImpuesto: row.tipoImpuesto?.id!,
            precioUnitario: row.precioUnitario
          }
        }),
        prioridad: prioridad!,
        proveedorId: proveedor!,
        solicitudEstatus: estatus,
        titulo: titulo!
    },this.idSolicitudCompra).subscribe( res => {


      if (estatus === 'BORRADOR') {
        this.dialogConfirm.display = true;
        this.dialogConfirm.icon = 'fa-floppy-disk';
        this.dialogConfirm.labelBtn = 'Cerrar'
        this.dialogConfirm.title = 'Solicitud actualizada con éxito';
        this.dialogConfirm.description = 'Tu solicitud se actualizo correctamente';  
      }else{
        this.dialogConfirm.display = true;
        this.dialogConfirm.icon = 'fa-floppy-disk';
        this.dialogConfirm.labelBtn = 'Cerrar'
        this.dialogConfirm.title = 'Solicitud enviada con éxito';
        this.dialogConfirm.description = 'Tu solicitud ha sido enviada, queda en espera de autorización.';
      }


    })
  }


  back(){
    this.router.navigate(['../../'], {relativeTo: this.route});
  }

  cancelCambioPrecio(event:any){
    console.log(event);
    console.log(this.listaPartidas);
  }

  eventDialogCambioPrecio(event:{id:string,action:boolean}){
    console.log(event);
    let partida = this.listaPartidas.filter(lp => lp.id === event.id);
    console.log(partida);

    if (event.action) {
      
      this.solicitudCompraApiService.setPrecioProducto({
        idPrecio: partida[0].idPrecio,
        precio: partida[0].precioUnitario
      }).subscribe( res => {
        console.log(res);
        // item.precio = res.precio;
      })

    }else{
      if (partida) {
        partida[0].precioUnitario = partida[0].precioUnitarioOriginal
      }
    }
  }

  regresar(){
    this.dialogOption.display = true;
    this.dialogOption.id = 'exit';
    this.dialogOption.icon = 'fa-floppy-disk';
    this.dialogOption.color = 'orange';
    this.dialogOption.title = 'Estas por salir de la página'
    this.dialogOption.description = 'Esta acción borrará de forma permanente la solicitud de compra.';
    this.dialogOption.option1label = 'Cerrar';
    this.dialogOption.option1Severity = 'primary';
    this.dialogOption.option2label = 'Salir de la página';
  }

  option1(event:any){
    if (event === 'exit') {
      this.dialogOption.display = false;
    }else if (event === 'delete'){
      this.dialogOption.display = false;
    }
  }
  option2(event:any){
    if (event === 'exit') {
      this.back();
    }else if (event === 'delete'){
      this.dialogOption.display = false;
      this.deleteAll();
    }

  }

  eliminarPartida(){
    // modalEliminarTodo.onDisplay(this.listaSeleccionada.length)
    this.dialogOption.display = true;
    this.dialogOption.id = 'delete';
    this.dialogOption.icon = 'fa-trash';
    this.dialogOption.color = 'red';
    this.dialogOption.title = '¿Quieres eliminar la partida?'
    this.dialogOption.description = 'Esta acción borrará de forma permanente la partida de la solicitud de compra.';
    this.dialogOption.option1label = 'No';
    this.dialogOption.option1Severity = 'danger';
    this.dialogOption.option2label = 'Eliminar partida';
  }

}
export interface PartidaModel{
  id: string
  producto: ProductoResponseDto | null,
  cantidad: number,
  tipoImpuesto: TipoImpuestoResponseDto | null,
  precioUnitario: number,
  descuento: number,
  subTotal: number
}

