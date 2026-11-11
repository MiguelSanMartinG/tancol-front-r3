import { NgTemplateOutlet } from '@angular/common';
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

@Component({
  selector: 'app-registrar',
  imports: [
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
    confirmPassword:['',[Validators.required]]
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
        summary: '!Precaución!',
        detail: 'Hay campos inválidos o faltan campos por llenar.',
      });
      return;
    }
    const formValue = this.formulario.getRawValue();
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
      enabled:true
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
