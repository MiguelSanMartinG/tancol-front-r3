import { TipoImpuestoResponseDto } from '../../tipo-impuesto/services/dtos/tipo-impuesto.response.dto';
import { AfterViewInit, Component, inject, OnInit, ViewChild } from '@angular/core';
import { BotonRegresarComponent } from '../../../../shared/components/boton-regresar/boton-regresar.component';
import { HeaderComponent } from '../../../../shared/components/header/header.component';
import { AppPrimengModule } from '@shared/app-primeng/app-primeng.module';
import { EliminarComponent } from '../../departamento/eliminar/eliminar.component';
import { DialogEliminarTodoComponent } from '../../../../shared/components/dialog-eliminar-todo/dialog-eliminar-todo.component';
import { FormBuilder, Validators } from '@angular/forms';
import { ProveedorApiService } from '../../proveedor/services/proveedor.api.service';
import { AppSharedModule } from '@shared/app-shared.module';
import { ProductoApiService } from '../../producto/services/producto.api.service';
import { TipoImpuestoApiService } from '../../tipo-impuesto/services/tipo-impuesto.api.service';
import { ProductoResponseDto } from '../../producto/services/dtos/producto.response.dto';
import { Table } from 'primeng/table';
import { v4 as uuidv4 } from 'uuid';
import { ActivatedRoute } from '@angular/router';
import { OrdenCompraApiService } from '../services/orden-compra.api.service';
import { FilterBarComponent } from '@shared/components/filter-bar/filter-bar.component';
import { CommonModule } from '@angular/common';
import { FloatLabel } from 'primeng/floatlabel';
import { OrdenResponseDto } from '../services/dtos/orden-compra.response.dto';
import { OrdenFacturacionDto } from '../services/dtos/order-facturacion.dto';

@Component({
  selector: 'app-actualizar-solicitud-compra',
  imports: [
    BotonRegresarComponent,
    HeaderComponent,
    AppPrimengModule,
    EliminarComponent,
    DialogEliminarTodoComponent,
    AppSharedModule,
    CommonModule,
    FloatLabel
],
  templateUrl: './actualizar-solicitud-compra.component.html',
  styleUrl: './actualizar-solicitud-compra.component.scss',
})
export class ActualizarOrdenCompraComponent implements OnInit, AfterViewInit {
  route = inject(ActivatedRoute);
  @ViewChild('table') table!: Table;
  ordenCompraApiService = inject(OrdenCompraApiService);
  apiProveedores = inject(ProveedorApiService);
  apiTipoImpuesto = inject(TipoImpuestoApiService);
  apiProductos = inject(ProductoApiService);
  fb = inject(FormBuilder);
  formulario = this.fb.group({
    folioExterno: ['',Validators.required],
    proveedor: [ {
      value: '',
      disabled: true,
    },Validators.required],
    razonSocial: [
      {
        value: '',
        disabled: true,
      },
    ],
    fechaSolicitud: [ {
      value: new Date(),
      disabled: true,
    }],
    prioridad: [ {
      value: '',
      disabled: true,
    }],
    titulo: [ {
      value: '',
      disabled: true,
    }],
  });
  @ViewChild(EliminarComponent) eliminarComponent!: EliminarComponent;
  listaSeleccionada: any[] = [];
  // listaPartidas: PartidaModel[] = [];
  id: string  = '';
  listaPartidas: {
    id: string
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
  comentarios!:string;
  orden!:OrdenResponseDto;
  ngOnInit(): void {
    this.apiProveedores.getAll().subscribe();
    this.ordenCompraApiService.getAllPrioridades().subscribe();
    this.apiProductos.getAll().subscribe();
    this.apiTipoImpuesto.getAll().subscribe();

  }
  getIPartida(id: string){
    this.ordenCompraApiService.getOne(id).subscribe( res => {
      console.log(res);
      this.orden = res;
      this.formulario.patchValue({
        proveedor: res.proveedor?.idProveedor,
        fechaSolicitud: new Date(res.fechaCreacionSolicitud),
        prioridad: res.prioridad,
        titulo: res.titulo,
      });

      this.findRazonSocial();


      for(const partida of res.partidas){
        this.cargarPartidad(partida);

      }
    });
  }
  ngAfterViewInit(): void {
    this.route.paramMap.subscribe( params => {
      this.id = params.get('id')!;
      this.getIPartida(this.id);
    });
  }
  addPartidad(){
    this.listaPartidas.push({
      id: uuidv4(),
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

    this.table.initRowEdit(this.listaPartidas[this.listaPartidas.length - 1]);
  }
  findRazonSocial() {
    console.log(this.formulario.getRawValue());
    const id = this.formulario.getRawValue().proveedor
    const proveedor = this.apiProveedores
      .listProveedor()
      .find((row) => row.idProveedor == id!);
      console.log(proveedor);
      console.log(this.apiProveedores
        .listProveedor());
      this.formulario.patchValue({
        razonSocial:proveedor?.infoFiscal.razonSocial
      });

    // this.formulario.get('razonSocial')?.setValue(proveedor?.infoFiscal.razonSocial!);

  }
  getPrecioProducto(item: any){
    const id = this.formulario.get('proveedor')?.value;
    this.ordenCompraApiService.getPrecioProducto({
      idProveedor: id!,
      idProducto: item.producto.id
    }).subscribe( res => {
      item.precio = res.precio;
    })
  }
  setPrecio(item: any, event: any){
    console.log(event.target.value);

    return;
    const id = this.formulario.get('proveedor')?.value;
    this.ordenCompraApiService.setPrecioProducto({
      idProveedor: id!,
      idProducto: item.producto.id,
      precio: event.target.value
    }).subscribe( res => {
      item.precio = res.precio;
    })
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
       return;
   }

   console.log(this.formulario.valid);
    // for(const partida of this.listaPartidas){
    //   if(partida.producto && partida.tipoImpuesto && partida.cantidad > 0 && partida.precioUnitario){
    //     continue;
    //   }
    //   alert('No estan completados los registros de partida')
    //   return;
    // }
    this.submit('FACTURADO');
  }


  submit(estatus: 'FACTURADO' | 'BORRADOR'){
    console.log(this.orden);
    console.log(this.formulario.getRawValue());
    let request:OrdenFacturacionDto = {
      comentarioFactura:this.comentarios,
      facturacionOrdenEstatus:estatus,
      folioExterno:this.formulario.getRawValue().folioExterno as string,
      orderId:this.orden.idSolicitud,
      partidas:this.orden.partidas.map((partida)=>{
        return {
          cantidad:partida.cantidad!,
          descuentoAplicado:partida.descuentoAplicado!,
          precioUnitario:partida.precioUnitario!,
          idImpuesto:partida.tipoImpuesto.id!,
          idProducto:partida.producto.idProducto!
        }
      })
    }

    console.log(request);


    this.ordenCompraApiService.facturar(request).subscribe( res => {
      console.log(res);
        alert('registrado')
    })
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
