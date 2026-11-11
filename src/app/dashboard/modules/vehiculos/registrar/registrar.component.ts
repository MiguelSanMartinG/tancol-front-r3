import { NgTemplateOutlet } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AppPrimengModule } from '@shared/app-primeng/app-primeng.module';
import { MessageErrorComponent } from '@shared/components/message-error/message-error.component';
import { ProveedorApiService } from '../../proveedor/services/proveedor.api.service';
import { MessageService } from 'primeng/api';
import { alreadyTaken } from '@core/common/already-taken.validator';
import { HeaderComponent } from '@shared/components/header/header.component';
import { ActivatedRoute, Router } from '@angular/router';
import { AppSharedModule } from '@shared/app-shared.module';
import { FormComponent } from '../form/form.component';
import { VehiculosApiService } from '../services/vehiculos-api.service';
import { VehiculosDTO } from '../services/vehiculos.dto';
import { UploadFileApiService } from '@shared/services/upload-file.api.service';

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
  VehiculosApiService = inject(VehiculosApiService);
  uploadFileApi = inject(UploadFileApiService)
  fb = inject(FormBuilder);
    router = inject(Router);
    route = inject(ActivatedRoute);
  
  formulario = this.fb.group({
    nombre: ['', [Validators.required],[alreadyTaken(this.VehiculosApiService,'?nombre=')]],
    placas: ['', [Validators.required],[]],
    status: ['DISPONIBLE', [Validators.required]],
    capacidadMaxima: ['', [Validators.required,Validators.min(1)]],
    vigencia: ['', [Validators.required]],
    descripcion: ['', [Validators.required]],
    documentoPoliza: [''],
    numeroPoliza:['',[Validators.required]],
    unidadMedida:['',[Validators.required]]

  });
  messageService = inject(MessageService);

  validarRegistros() {
      console.log(this.formulario.getRawValue());
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
      this.save(null)
    }

    

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
      statusVehiculo: 'DISPONIBLE',
      unidadMedida:formValue.unidadMedida!,
      vigenciaPoliza: formValue.vigencia!,

    }

    this.VehiculosApiService.create(request)
      .subscribe((resp) => {
        console.log(resp);
        // this.display = false;
        this.formulario.reset();
        this.messageService.clear();
        this.router.navigate(['../'], { relativeTo: this.route });
        this.messageService.add({
          key: 'top-right',
          severity: 'success',
          summary: '¡Registro exitoso!',
          detail: 'Se ha registrado el Vehiculo',
        });
      });
  }

  handleHide(){
    this.formulario.reset();
  }

}
