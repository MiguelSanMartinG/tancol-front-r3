import { Component, inject, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { alreadyTaken } from '@core/common/already-taken.validator';
import { MessageService } from 'primeng/api';
import { AppPrimengModule } from '@shared/app-primeng/app-primeng.module';
import { MessageErrorComponent } from '@shared/components/message-error/message-error.component';
import { NgTemplateOutlet } from '@angular/common';
import { HeaderComponent } from '@shared/components/header/header.component';
import { AppSharedModule } from '@shared/app-shared.module';
import { FormComponent } from '../form/form.component';
import { VehiculosApiService } from '../services/vehiculos-api.service';
import { VehiculosDTO } from '../services/vehiculos.dto';
import { UploadFileApiService } from '@shared/services/upload-file.api.service';

@Component({
  selector: 'app-editar',
  templateUrl: './editar.component.html',
  imports: [
      AppPrimengModule, 
      ReactiveFormsModule, 
      MessageErrorComponent,  
      NgTemplateOutlet,
      HeaderComponent,
      AppSharedModule,
      FormComponent
    ],
  // styles: [':host{display:contents}'], // Makes component host as if it was not there, can offer less css headaches. Use @HostBinding class approach for easier overrides.
  // host: { class: 'contents' },
})
export class EditarComponent {
    vehiculosApiServie = inject(VehiculosApiService);
      uploadFileApi = inject(UploadFileApiService)
    
    fb = inject(FormBuilder);
    router = inject(Router);
    route = inject(ActivatedRoute);
    @ViewChild('form') form!:FormComponent

    formulario = this.fb.group({
    nombre: ['', [Validators.required],[alreadyTaken(this.vehiculosApiServie,'?nombre=')]],
    placas: ['', [Validators.required],[]],
    status: ['DISPONIBLE', [Validators.required]],
    capacidadMaxima: ['', [Validators.required,Validators.min(1)]],
    vigencia: [new Date(), [Validators.required]],
    descripcion: ['', [Validators.required]],
    documentoPoliza: [''],
    numeroPoliza:['',[Validators.required]],
    unidadMedida:['',[Validators.required]],
    id:['',[Validators.required]],
    });

    messageService = inject(MessageService);
    

    constructor(){
      this.route.paramMap.subscribe(params => {
        const id = params.get('id');
        console.log('id',id);

        if (id) {
          this.cargarDatos(id);
        }

      })

    }

    cargarDatos(id:string){
      this.vehiculosApiServie.getOne(id).subscribe((resp)=>{
        console.log(resp);

        this.formulario.patchValue({
          nombre:resp.nombre,
          placas:resp.placas,
          status:(resp.status)?resp.status:'DISPONIBLE',
          capacidadMaxima:(resp.capacidadMaxima)?resp.capacidadMaxima.toString():'0',
          vigencia:new Date(resp.vigenciaPoliza),
          descripcion:resp.descripcion,
          numeroPoliza:resp.numeroPoliza,
          unidadMedida:resp.unidadMedida.idUnidadDeMedida,
          id:id
        })

        this.form.archivoNombre = resp.documentoPoliza
        
      })
    }

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
      console.log(formValue);

          if (formValue.documentoPoliza) {
      this.uploadFileApi.create(formValue.documentoPoliza).subscribe({
        next:(resp)=>{
          console.log(resp);
          this.save(resp.fileName)
        }
      });
    }else{
      this.save(this.form.archivoNombre)
    }

      // let request:VehiculosDTO = {
      //   capacidadMaxima:parseFloat(formValue.capacidadMaxima!),
      //   nombre: formValue.nombre!,
      //   placas: formValue.placas!,
      //   status: 'DISPONIBLE',
      //   vigencia: new Date(formValue.vigencia!).toISOString()      }


//       this.vehiculosApiServie.update(request,formValue.id!).subscribe((resp) => {
// // this.display = false;
// this.formulario.reset();
// this.messageService.clear();
// this.router.navigate(['../../'], { relativeTo: this.route });
// this.messageService.add({
//   key: 'top-right',
//   severity: 'success',
//   summary: '¡Actualización exitosa!',
//   detail: 'Se ha actualizado el empleado',
// });
//       });
    }
  save(polizaFile:string|null = null){
        const formValue = this.formulario.getRawValue();

        let request:VehiculosDTO = {
      capacidadMaxima:parseFloat(formValue.capacidadMaxima!),
      descripcion:formValue.descripcion!,
      documentoPoliza:polizaFile,
      nombre: formValue.nombre!,
      numeroPoliza:formValue.numeroPoliza!,
      placas: formValue.placas!,
      statusVehiculo: formValue.status!,
      unidadMedida:formValue.unidadMedida!,
      vigenciaPoliza: <any> formValue.vigencia!,

    }

    this.vehiculosApiServie.update(request,formValue.id!)
      .subscribe((resp) => {
        console.log(resp);
        // this.display = false;
        this.formulario.reset();
        this.messageService.clear();
        this.router.navigate(['../../'], { relativeTo: this.route });
        this.messageService.add({
          key: 'top-right',
          severity: 'success',
          summary: '¡Registro exitoso!',
          detail: 'Se ha actualizado el Vehiculo',
        });
      });
  }



    handleHide(){
      this.formulario.reset();
    }

      passwordsIgualesValidator(form: FormGroup): ValidationErrors | null {
        const password = form.get('pass')?.value;
        const confirmPassword = form.get('confirmPassword')?.value;
      
        return password === confirmPassword ? null : { passwordMismatch: true };
      }
}
