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
import { FormComponent, SalidaMaterialPartida } from '../form/form.component';
import { SalidaMaterialApiService } from '../service/salida-material.service';
import { SalidaMaterialDTO } from '../service/salida-material.dto';
import { LocalStorageService } from '@shared/services/local-storage.service';


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
  salidaMaterialApiService = inject(SalidaMaterialApiService);
    messageService = inject(MessageService);
  localStorage = inject(LocalStorageService)

  fb = inject(FormBuilder);
    router = inject(Router);
    route = inject(ActivatedRoute);
  
formulario = this.fb.group({
  folio: [{value:'',disabled:true}],
  comentarios: [],
  empleadoEmisor: [{value:this.localStorage.getUserInfo()?.nombre,disabled:true}, Validators.required],
  idempleadoEmisor: [{value:this.localStorage.getUserInfo()?.idEmpleado,disabled:true}, Validators.required],
  empleadoReceptor: ['', Validators.required],
  estado: ['EN_USO'],
  fechaElaboracion: [new Date(),Validators.required],
  uso: ['',Validators.required],
  // partidas: this.fb.array([
  //   this.fb.group({
  //     cantidad: [0],
  //     comentarioPartida: [''],
  //     idAlmacen: [''],
  //     idProductoBasico: [''],
  //     unidadMedida: ['']
  //   })
  // ])
});

listaPartidas: SalidaMaterialPartida[] = [];
  validarRegistros() {
    console.log(this.listaPartidas);
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
    let index = 0;

        for(const partida of this.listaPartidas){
      console.log(partida);
      if(partida.almacen && partida.producto && partida.cantidad > 0 && partida.unidadMedida){
        continue;
      }
      this.messageService.add({
        key: 'center',
        severity: 'warn',
        summary: '!Precaución!',
        detail: 'Faltan datos en la partida No. '+index+1,
      });
       index++;
      return;
    }


    const formValue = this.formulario.getRawValue();
    console.log(formValue);
    let request:SalidaMaterialDTO = {
      empleadoEmisor: formValue.idempleadoEmisor!,
      empleadoReceptor: formValue.empleadoReceptor!,
      fechaElaboracion: new Date(formValue.fechaElaboracion!).toISOString(),
      uso: formValue.uso!,
      comentarios: formValue.comentarios!,
      estado: formValue.estado!,
      partidas:this.listaPartidas.map((partida:any)=>{
        return {
          idAlmacen: partida?.almacen ?? '',
          idProductoBasico: partida.producto?.id??'',
          cantidad: partida.cantidad,
          unidadMedida: partida.unidadMedida?.idUnidadDeMedida ?? partida.unidadMedida,
          comentarioPartida: partida.comentario,
        }
      })


    }
      console.log(request);

    this.salidaMaterialApiService.create(request)
      .subscribe({
        next: () => {
          this.formulario.reset();
          this.messageService.clear();
          this.router.navigate(['../'], { relativeTo: this.route });
          this.messageService.add({
            key: 'top-right',
            severity: 'success',
            summary: '¡Registro exitoso!',
            detail: 'Se ha registrado el la salida de material',
          });
        },
        error: (error) => {
          const body = error?.error;
          const detail = typeof body === 'string' ? body : body?.message ?? 'No se pudo registrar la salida de material.';
          this.messageService.add({
            key: 'center',
            severity: error?.status === 409 ? 'warn' : 'error',
            summary: 'No se pudo registrar',
            detail: String(detail),
          });
        },
      });
  }
  handleHide(){
    this.formulario.reset();
  }

//   get partidas(): FormArray {
//   return this.formulario.get('partidas') as FormArray;
// }
// agregarPartida(): void {
//   this.partidas.push(
//     this.fb.group({
//       cantidad: [0],
//       comentarioPartida: [''],
//       idAlmacen: [''],
//       idProductoBasico: [''],
//       unidadMedida: ['']
//     })
//   );
// }
// eliminarPartida(index: number): void {
//   this.partidas.removeAt(index);
// }

}
