import { NgTemplateOutlet } from '@angular/common';
import { BotonCancelarComponent } from '@shared/components/boton-cancelar/boton-cancelar.component';
import { Component, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { AppPrimengModule } from '@shared/app-primeng/app-primeng.module';
import { MessageErrorComponent } from '@shared/components/message-error/message-error.component';
import { ProveedorApiService } from '../../proveedor/services/proveedor.api.service';
import { MessageService } from 'primeng/api';
import { alreadyTaken } from '@core/common/already-taken.validator';
import { HeaderComponent } from '@shared/components/header/header.component';
import { ActivatedRoute, Router } from '@angular/router';
import { AppSharedModule } from '@shared/app-shared.module';
import { EmpleadoApiService } from '../services/empleado.api.service';
import { FormComponent } from '../form/form.component';
import { datosLaboralesControles, datosLaboralesRequest } from '../form/datos-laborales';
import { ArchivosSubidos, datosRhControles, datosRhParaRequest, documentosPorSubir } from '../form/datos-rh';
import { ImagePickerComponent } from '@shared/components/image-picker/image-picker.component';
import { UploadFileApiService } from '@shared/services/upload-file.api.service';
import { environment } from '../../../../../environments/environment';
import { forkJoin, map, of } from 'rxjs';

@Component({
  selector: 'app-registrar',
  imports: [ImagePickerComponent, BotonCancelarComponent, 
    AppPrimengModule, 
    ReactiveFormsModule, 
    NgTemplateOutlet,
    HeaderComponent,
    AppSharedModule,
    FormComponent
  ],
  templateUrl: './registrar.component.html',
  styleUrl: './registrar.component.scss',
})
export class RegistrarComponent {
  EmpleadoApiService = inject(EmpleadoApiService);
  private readonly uploadFileApi = inject(UploadFileApiService);
  /** Foto nueva elegida (se sube al guardar). */
  foto: File | null = null;
  readonly imagenesUrl = `${environment.apiUrl}images/`;
  fb = inject(FormBuilder);
    router = inject(Router);
    route = inject(ActivatedRoute);
    // [alreadyTaken(this.EmpleadoApiService,'?nombre=')]
  formulario = this.fb.group({
    nombre: ['', [Validators.required]],
    primerApellido: ['', [Validators.required]],
    segundoApellido: ['', [Validators.required]],
    rol: ['', [Validators.required]],
    tipoEmpleado: ['', [Validators.required]],
    correo: ['', [Validators.required]],
    telefono: ['', [Validators.required]],
    fechaNacimiento: ['', [Validators.required]],
    departamento: ['', [Validators.required]],
    pass:['',[Validators.required]],
    confirmPassword:['',[Validators.required]],
    ...datosLaboralesControles(),
    ...datosRhControles(),
    idImagen: [''],
  },
  {
    validators: this.passwordsIgualesValidator,
  }
);
  messageService = inject(MessageService);

  validarRegistros() {
    console.log(this.formulario.getRawValue());
    if (!this.formulario.valid) {
      this.formulario.markAllAsTouched();
      this.messageService.add({
        key: 'center',
        severity: 'warn',
        summary: '¡Precaución!',
        detail: 'Hay campos inválidos o faltan campos por llenar.',
      });
      return;
    }
    const formValue = this.formulario.getRawValue();
    // Primero se suben los archivos nuevos de documentos; si alguno falla, no se guarda.
    forkJoin({
        subidos: this.EmpleadoApiService.subirDocumentos(documentosPorSubir(formValue)),
        // La foto se sube a /upload (imágenes); si no cambió se conserva la guardada.
        foto: this.foto ? this.uploadFileApi.create(this.foto).pipe(map((r) => r.fileName)) : of(formValue.idImagen || null),
      }).subscribe({
      next: ({ subidos, foto }) => this.guardar({ ...formValue, idImagen: foto }, subidos),
      error: () => this.errorSubida(),
    });
  }

  private errorSubida() {
    this.messageService.add({
      key: 'top-right',
      severity: 'error',
      summary: 'Error al subir documentos',
      detail: 'No se pudo subir uno o más archivos. No se guardó el empleado; intenta de nuevo.',
    });
  }

  private guardar(formValue: ReturnType<RegistrarComponent['formulario']['getRawValue']>, subidos: ArchivosSubidos) {
    this.EmpleadoApiService.create({
      nombre:formValue.nombre!,
      apellidoPaterno:formValue.primerApellido!,
      apellidoMaterno:formValue.segundoApellido!,
      idTipoEmpleado:formValue.tipoEmpleado!,
      idRol: formValue.rol!,
      correo:formValue.correo!,
      telefono:formValue.telefono!,
      fechaNacimiento:formValue.fechaNacimiento!,
      idDepartamento:formValue.departamento!,
      password:formValue.pass!,
      enabled:true,
      ...datosLaboralesRequest(formValue),
      ...datosRhParaRequest(formValue, subidos),
      idImagen: formValue.idImagen || null,
    }).subscribe((resp)=>{
      this.formulario.reset();
        this.messageService.clear();
        this.router.navigate(['../'], { relativeTo: this.route });
        this.messageService.add({
          key: 'top-right',
          severity: 'success',
          summary: '¡Registro exitoso!',
          detail: 'Se ha registrado el empleado',
        });
    })
    // this.EmpleadoApiService.create({
    //     nombre: this.formulario.getRawValue().nombre!,
    //     alias: this.formulario.getRawValue().alias!
    //   })
    //   .subscribe((resp) => {
    //     console.log(resp);
    //     // this.display = false;
    //     this.formulario.reset();
    //     this.messageService.clear();
    //     this.router.navigate(['../'], { relativeTo: this.route });
    //     this.messageService.add({
    //       key: 'top-right',
    //       severity: 'success',
    //       summary: '¡Registro exitoso!',
    //       detail: 'Se ha registrado el tipo de empleado',
    //     });
    //   });
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
