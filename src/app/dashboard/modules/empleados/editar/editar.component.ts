import { Component, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { alreadyTaken } from '@core/common/already-taken.validator';
import { MessageService } from 'primeng/api';
import { AppPrimengModule } from '@shared/app-primeng/app-primeng.module';
import { MessageErrorComponent } from '@shared/components/message-error/message-error.component';
import { NgTemplateOutlet } from '@angular/common';
import { HeaderComponent } from '@shared/components/header/header.component';
import { AppSharedModule } from '@shared/app-shared.module';
import { EmpleadoApiService } from '../services/empleado.api.service';
import { FormComponent } from '../form/form.component';
import { EmpleadoDto } from '../services/dtos/empleado.create.dto';

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
    empleadoApiService = inject(EmpleadoApiService);
    fb = inject(FormBuilder);
    router = inject(Router);
    route = inject(ActivatedRoute);
    formulario = this.fb.group({
      nombre: ['', [Validators.required]],
      primerApellido: ['', [Validators.required]],
    segundoApellido: ['', [Validators.required]],
    rol: ['', [Validators.required]],
    tipoEmpleado: ['', [Validators.required]],
      correo: ['', [Validators.required]],
      enabled:[false],
      telefono: ['', [Validators.required]],
      fechaNacimiento: ['', [Validators.required]],
      departamento: ['', [Validators.required]],
      pass:['',[]],
      confirmPassword:['',[]],
      id:['']
    },
    {
      validators: this.passwordsIgualesValidator,
    }
  );
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
      this.empleadoApiService.getOne(id).subscribe((resp)=>{
        console.log(resp);

        this.formulario.patchValue({
          nombre:resp.nombre,
          primerApellido:resp.apellidoPaterno,
          segundoApellido:resp.apellidoMaterno,
          rol: resp.role?.id,
          tipoEmpleado:resp.tipoEmpleado?.idTipoEmpleado,
          correo:resp.email,
          enabled:resp.enabled,
          telefono:resp.telefono,
          fechaNacimiento:new Date(),
          departamento:resp.departamento?.idDepartamento,
          pass:'',
          confirmPassword:'',
          id:id
        })
        
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
      let request:EmpleadoDto = {
        apellidoMaterno: formValue.segundoApellido,
        apellidoPaterno: formValue.primerApellido,
        correo: formValue.correo,
        enabled: formValue.enabled ?? true,
        fechaNacimiento: formValue.fechaNacimiento,
        idDepartamento: formValue.departamento,
        idRol: formValue.rol,
        idTipoEmpleado: formValue.tipoEmpleado,
        nombre: formValue.nombre,
        telefono: formValue.telefono,
      };

      if (formValue.pass) {
        request.password = formValue.pass;
      }

      console.log(request)
      this.empleadoApiService.update(request,formValue.id).subscribe((resp) => {
// this.display = false;
this.formulario.reset();
this.messageService.clear();
this.router.navigate(['../../'], { relativeTo: this.route });
this.messageService.add({
  key: 'top-right',
  severity: 'success',
  summary: '¡Actualización exitosa!',
  detail: 'Se ha actualizado el empleado',
});
      });

      // this.empleadoApiService.update({
      //     nombre: this.formulario.getRawValue().nombre!,
      //     alias: ''
      //   },this.formulario.getRawValue()['id'] as string)
      //   .subscribe((resp) => {
      //     console.log(resp);
      //     // this.display = false;
      //     this.formulario.reset();
      //     this.messageService.clear();
      //     this.router.navigate(['../../'], { relativeTo: this.route });
      //     this.messageService.add({
      //       key: 'top-right',
      //       severity: 'success',
      //       summary: '¡Actualización exitosa!',
      //       detail: 'Se ha actualizado el tipo de cliente',
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
