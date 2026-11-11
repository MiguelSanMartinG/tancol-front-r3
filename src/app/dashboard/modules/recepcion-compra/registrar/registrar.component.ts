import { ChangeDetectorRef, Component, inject, OnInit, ViewChild } from '@angular/core';
import { AppPrimengModule } from '@shared/app-primeng/app-primeng.module';
import { AppSharedModule } from '@shared/app-shared.module';
import { BotonRegresarComponent } from '@shared/components/boton-regresar/boton-regresar.component';
import { HeaderComponent } from '@shared/components/header/header.component';
import { OrderReciboService } from '../service/order-recibo/order-recibo.service';
import { ActivatedRoute, Router } from '@angular/router';
import { OrdenReciboResponse, Partida } from '../service/dto/order-recibo.response';
import { FloatLabel } from 'primeng/floatlabel';
import { AlmacenApiService } from '../../almacen/services/almacen.api.service';
import { OrdenReciboDto } from '../service/dto/order-recibo.dto';
import { CommonModule } from '@angular/common';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { DialogConfirmComponent } from '@shared/components/dialog-confirm/dialog-confirm.component';

@Component({
  selector: 'app-registrar',
  imports: [AppPrimengModule,
        BotonRegresarComponent,
        HeaderComponent,
        AppPrimengModule,
        AppSharedModule,
        FloatLabel,
        CommonModule,
        DialogConfirmComponent
  ],
  templateUrl: './registrar.component.html',
  styleUrl: './registrar.component.scss'
})
export class RegistrarComponent implements OnInit{
  router = inject(Router);
  route = inject(ActivatedRoute);
  orderReciboService = inject(OrderReciboService)
  almacenApi = inject(AlmacenApiService)
  idOrden:string =''
  listaPartidas:Partida[] = [];
  almacen:any = [];
  comentarios:string = '';
  orden!:OrdenReciboResponse
  formOrdenCompra: FormGroup;
  @ViewChild(DialogConfirmComponent) dialogConfirm!:DialogConfirmComponent;

  constructor(
    private cdr: ChangeDetectorRef,
    private fb:FormBuilder
  ){

    this.formOrdenCompra = this.fb.group({
      idOrden:['',Validators.required],
      verificado:[false],
      partidas:this.fb.array([])
    })


    this.route.paramMap.subscribe( params => {
      this.idOrden = params.get('id')!;
      this.getOrden();
    });
  }


  ngOnInit(): void {
    this.almacenApi.getAll().subscribe();
  }

  nuevaPartida(partida:Partida): FormGroup {
    console.log(partida);
    return this.fb.group({
      idPartida: [partida.idPartida],
      producto: [partida.producto, Validators.required],
      cantidadSolicitada: [partida.cantidad, [Validators.required, Validators.min(1)]],
      cantidadRecibida: [(partida.unidadesRecibidas)?partida.unidadesRecibidas:'', [Validators.required, Validators.min(0), Validators.max(9999)]],
      verificado: [(partida.verificado)?partida.verificado:false],
      almacen: [(partida.almacen)?partida.almacen:null, Validators.required],
      precioProducto:[partida.precioProveedor]
    });
  }
  get partidas(): FormArray {
    return this.formOrdenCompra.get('partidas') as FormArray;
  }
  
  agregarPartida(partida:Partida) {
    this.partidas.push(this.nuevaPartida(partida));
  }

  getOrden(){
    this.orderReciboService.getOne(this.idOrden).subscribe(
      (response)=>{
        console.log(response);
        this.orden = response;
        console.log(response);
        this.listaPartidas = response.partidas
        this.formOrdenCompra.patchValue({
          idOrden:response.idSolicitud,
          comentario:response.comentarioFactura
        })
        this.listaPartidas.forEach((value, index, array) => {
          this.agregarPartida(value)
        })
      }
    )
  }

  regresar(){
        this.router.navigate(['../../'], {relativeTo: this.route});

  }

  submitFlag:boolean = false;
  validarRegistros(){
    console.log(this.formOrdenCompra);
    if (!this.formOrdenCompra.valid) {
      this.formOrdenCompra.markAllAsTouched();
      return;
    }
    this.submit('RECIBIDA')
  }


  submit(type:'BORRADOR'| 'RECIBIDA'){

    let form = this.formOrdenCompra.getRawValue();
    console.log(form);

    let request:OrdenReciboDto = {
      idOrden:form.idOrden,
      comentarioRecibo:form.comentario,
      recepcionEstatus:type,
      partidas: form.partidas.map((partida:any)=>{
        return {
          idPartida:partida.idPartida,
          idAlmacen:(partida.almacen)?partida.almacen?.id:null,
          verificado:partida.verificado,
          unidadesRecibidas:partida.cantidadRecibida,
          presentacionProducto:{
            idPrecio:partida.precioProducto.idPrecio,
            precio:partida.precioProducto.precio
          }
        }
      })
      
    }

    console.log(request);

    this.orderReciboService.recibo(request).subscribe(
      (response)=>{
        console.log(response);
        this.dialogConfirm.display = true;
        this.dialogConfirm.icon = 'fa-floppy-disk';
        this.dialogConfirm.labelBtn = 'Cerrar'
  
        if (type === 'BORRADOR') {
          this.dialogConfirm.title = 'Borrador guardado con éxito';
          this.dialogConfirm.description = 'Tu solicitud ha sido guardada';
        }else{
          this.dialogConfirm.display = true;
          // this.dialogConfirm.icon = 'fa-floppy-disk';
          this.dialogConfirm.title = 'Recepción enviada';
          this.dialogConfirm.description = 'Tu recepción ha sido enviada';
        }
      }
    )

  }

  limitarUnidades(item: any) {
    console.log(item);
    if (item.unidadesRecibidas < 0) {
      item.unidadesRecibidas = 0;
    } else if (item.unidadesRecibidas > item.cantidad) {
      console.log('es mayor');
      item.unidadesRecibidas = item.cantidad;
    }else{
      item.unidadesRecibidas = item.unidadesRecibidas;
    }

    item = {
      ...item,
      unidadesRecibidas: item.unidadesRecibidas
    };

  }
  
  back(){
    this.router.navigate(['../../'], {relativeTo: this.route});
  }
}
