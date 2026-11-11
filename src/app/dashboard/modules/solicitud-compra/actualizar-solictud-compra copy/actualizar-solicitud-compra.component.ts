import { TipoImpuestoResponseDto } from '../../tipo-impuesto/services/dtos/tipo-impuesto.response.dto';
import { AfterViewInit, Component, computed, inject, OnInit, ViewChild } from '@angular/core';
import { BotonRegresarComponent } from '../../../../shared/components/boton-regresar/boton-regresar.component';
import { HeaderComponent } from '../../../../shared/components/header/header.component';
import { AppPrimengModule } from '@shared/app-primeng/app-primeng.module';
import { AlmacenResponseDto } from '../../almacen/services/dtos/almacen.response.dto';
import { EliminarComponent } from '../../departamento/eliminar/eliminar.component';
import { ImportFileComponent } from '../../../../shared/components/import-file/import-file.component';
import { DialogEliminarTodoComponent } from '../../../../shared/components/dialog-eliminar-todo/dialog-eliminar-todo.component';
import { MenuItem } from 'primeng/api';
import { OrdenApiService } from '../services/solicitud-compra.api.service';
import { BadgeEstatusOrdenComponent } from '../../../../shared/components/badge-estatus-orden/badge-estatus-orden.component';
import { BadgePrioridadOrdenComponent } from '../../../../shared/components/badge-prioridad-orden/badge-prioridad-orden.component';
import { FormBuilder, Validators } from '@angular/forms';
import { ProveedorApiService } from '../../proveedor/services/proveedor.api.service';
import { AppSharedModule } from '@shared/app-shared.module';
import { ProductoApiService } from '../../producto/services/producto.api.service';
import { TipoImpuestoApiService } from '../../tipo-impuesto/services/tipo-impuesto.api.service';
import { isNumber } from 'lodash';
import { ProductoResponseDto } from '../../producto/services/dtos/producto.response.dto';
import { Table } from 'primeng/table';
import { v4 as uuidv4 } from 'uuid';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-actualizar-solicitud-compra',
  imports: [
    BotonRegresarComponent,
    HeaderComponent,
    AppPrimengModule,
    EliminarComponent,
    DialogEliminarTodoComponent,
    AppSharedModule,
  ],
  templateUrl: './actualizar-solicitud-compra.component.html',
  styleUrl: './actualizar-solicitud-compra.component.scss',
})
export class ActualizarSolicitudCompraComponent implements OnInit, AfterViewInit {
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
    fechaSolicitud: [new Date(),[Validators.required]],
    prioridad: ['MEDIA'],
    titulo: ['',[Validators.required]],
  });
  @ViewChild(EliminarComponent) eliminarComponent!: EliminarComponent;
  listaSeleccionada: any[] = [];
  listaPartidas: PartidaModel[] = [];
  id: string  = '';

  ngOnInit(): void {
    this.apiProveedores.getAll().subscribe();
    this.solicitudCompraApiService.getAllPrioridades().subscribe();
    this.apiProductos.getAll().subscribe();
    this.apiTipoImpuesto.getAll().subscribe();

  }
  getIPartida(id: string){
    this.solicitudCompraApiService.getOne(id).subscribe( res => {
      this.formulario.patchValue({
        proveedor: res.proveedor.idProveedor,
        fechaSolicitud: new Date(res.fechaCreacionSolicitud),
        prioridad: res.prioridad,
        titulo: res.titulo,
      });
      for(const partida of res.partidas){
        this.cargarPartidad(partida);

      }
      this.findRazonSocial();
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
      precioUnitario: 0,
      descuento: 0,
      subTotal: 0,
    });
    this.table.initRowEdit(this.listaPartidas[this.listaPartidas.length - 1]);
  }
  cargarPartidad(partida: any){
    this.listaPartidas.push({
      cantidad: partida.cantidad,
      descuento: partida.descuento,
      id: partida.id,
      precioUnitario: partida.precio,
      producto: partida.producto,
      subTotal: 0,
      tipoImpuesto: partida.tipoImpuesto,
    });
    this.table.initRowEdit(this.listaPartidas[this.listaPartidas.length - 1]);
  }
  findRazonSocial() {
    const id = this.formulario.get('proveedor')?.value;
    const proveedor = this.apiProveedores
      .listProveedor()
      .find((row) => row.id == id!);
    this.formulario.get('razonSocial')?.setValue(proveedor?.infoFiscal.razonSocial!);

  }
  getPrecioProducto(item: any){
    const id = this.formulario.get('proveedor')?.value;
    this.solicitudCompraApiService.getPrecioProducto({
      idProveedor: id!,
      idProducto: item.producto.id
    }).subscribe( res => {
      item.precio = res.precio;
    })
  }
  setPrecio(item: any, event: any){
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
      fechaCreacionSolicitud: fechaSolicitud?.toISOString()!,
        partidas: this.listaPartidas.map( row => {
          return {
            cantidad: row.cantidad,
            descuentoAplicado: row.descuento,
            idProducto: row.producto?.id!,
            idImpuesto: row.tipoImpuesto?.id!,
            precioUnitario: row.precioUnitario
          }
        }),
        prioridad: prioridad!,
        proveedorId: proveedor!,
        solicitudEstatus: estatus,
        titulo: titulo!
    },this.id).subscribe( res => {
      setTimeout(()=> {
        this.router.navigate(['../../principal'], {relativeTo: this.route});
      },1000)
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
