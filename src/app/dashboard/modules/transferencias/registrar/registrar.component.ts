import { NgTemplateOutlet } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormArray, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AppPrimengModule } from '@shared/app-primeng/app-primeng.module';
import { MessageErrorComponent } from '@shared/components/message-error/message-error.component';
import { ProveedorApiService } from '../../proveedor/services/proveedor.api.service';
import { MessageService } from 'primeng/api';
import { alreadyTaken } from '@core/common/already-taken.validator';
import { HeaderComponent } from '@shared/components/header/header.component';
import { ActivatedRoute, Router } from '@angular/router';
import { AppSharedModule } from '@shared/app-shared.module';
import { TransferenciaService } from '../service/transferencia.service';
import { TransferenciaDTO } from '../service/transferencia.dto';
import { FormComponent } from '../form/form.component';
import { LocalStorageService } from '@shared/services/local-storage.service';
import { ProductoResponseDto } from '../../producto/services/dtos/producto.response.dto';

@Component({
  selector: 'app-registrar',
  imports: [
    AppPrimengModule, 
    ReactiveFormsModule, 
    MessageErrorComponent,  
    NgTemplateOutlet,
    HeaderComponent,
    AppSharedModule,
    FormComponent

  ],
  templateUrl: './registrar.component.html',
  styleUrl: './registrar.component.scss',
})
export class RegistrarComponent {
  transferenciaService = inject(TransferenciaService);
  localStorageService = inject(LocalStorageService)
  fb = inject(FormBuilder);
    router = inject(Router);
    route = inject(ActivatedRoute);
  
  formulario = this.fb.group({
    motivo: [''],
    folio:[{value:'',disabled:true}],
    entregadoPor:[{value:this.localStorageService.getUserInfo()?.nombre,disabled:true},[Validators.required]],
    fecha:[new Date(),Validators.required],
    almacenBase:['',Validators.required],
    almacenDestino:['',Validators.required]
  });

  listaPartidas:any[] = [
  //   {
  // id: '',
  // producto: null,
  // listaProducto:[],
  // unidadMedida: null,
  // stock: 0,
  // comentario: ''
  //   }
  ]

    // listaPartidas:ListaTransferencias[] {
    //   id: string
    //   producto: ProductoResponseDto | null,
    //   cantidad: number,
    //   unidadMedida:UnidadMedidaResponse | null,
    //   stock:number,
    //   comentario:string,
    //   listaProducto:ProductoResponseDto[],
    // }[] = [];


  messageService = inject(MessageService);






validarRegistros() {
  if (!this.formulario.valid) {
    this.formulario.markAllAsTouched();
    this.messageService.add({
      key: 'center',
      severity: 'warn',
      summary: '!Precaución!',
      detail: 'Hay campos inválidos o faltan campos por llenar.',
    });
    return;
  }

const formValue = this.formulario.getRawValue();
console.log(this.listaPartidas);
let errorPartida:boolean = false;

if (this.listaPartidas.length) {
  for (const element of this.listaPartidas) {
  if (element.cantidad < 1) {
    errorPartida = true;
  }
  if (element.producto === null) {
        errorPartida = true;
  }

  if (element.stock === 0) {
    errorPartida = true;
  }
}
}else{
        this.messageService.add({
      key: 'center',
      severity: 'error',
      summary: '!Precaución!',
      detail: 'No hay partidas agrega al menos una para continuar.',
    });
    return;
}



if (errorPartida) {
      this.messageService.add({
      key: 'center',
      severity: 'error',
      summary: '!Precaución!',
      detail: 'Hay errores en las partidas por favor verificar.',
    });
    return;
}

  let form  = this.formulario.getRawValue();

  let request:TransferenciaDTO = {
    motivo:form.motivo!,
    comentario:'',
    fecha: form.fecha!.toISOString(),
    idUsuario:this.localStorageService.getUserInfo()?.idEmpleado!,
    transferencias:[]
  }

  let contador = 0;

  for (const element of this.listaPartidas) {
    request.transferencias.push({
      indice:contador,
      cantidad:element.cantidad,
      compentarios:element.comentario,
      idAlmacenDestino:form.almacenDestino!,
      idAlmacenOrigen:form.almacenBase!,
      idProducto:element.producto.producto.idProducto,
      unidades:element.producto.unidadesMedida?.idUnidadDeMedida ?? null
    })
    contador++
  }

  console.log(request);



// const request: TransferenciaDTO = {
//   motivo: formValue.motivo!, // 👈 asegura que sea string
//   transferencias: <any> formValue.transferencias!
//   };  
// console.log('Request listo para enviar:', request);

  this.transferenciaService.create(request).subscribe({
    next: () => {
      this.formulario.reset();
      // this.transferenciasForm.clear(); // ← limpia las transferencias
      this.router.navigate(['../'], { relativeTo: this.route });
      this.messageService.add({
        key: 'top-right',
        severity: 'success',
        summary: '¡Registro exitoso!',
        detail: 'Se ha registrado la transferencia correctamente.',
      });
    },
    error: err => {
      console.error('Error al registrar:', err);
    }
  });
}

  handleHide(){
    this.formulario.reset();
  }

}


export interface ListaTransferencias{
  id: string;
  producto: ProductoResponseDto | null;
  listaProducto:{label:string, value:any}[];
  unidadMedida: any | null;
  stock: number;
  comentario: string;
}
