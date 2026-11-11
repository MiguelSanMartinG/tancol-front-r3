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
import { FormComponent } from '../form/form.component';
import { UnidadMedidaService } from '../service/unidad-medida.service';
import { UnidadMedidaDTO } from '../service/unidad-medida.dto';

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
    unidadMedidaService = inject(UnidadMedidaService);
    fb = inject(FormBuilder);
    router = inject(Router);
    route = inject(ActivatedRoute);
  formulario = this.fb.group({
    nombre: ['', [Validators.required],[alreadyTaken(this.unidadMedidaService,'?nombre=')]],
    alias: ['', [Validators.required]],
    id: ['']
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
      this.unidadMedidaService.getOne(id).subscribe((resp)=>{
        console.log(resp);

        this.formulario.patchValue({
          nombre:resp.nombre,
          alias:resp.alias,
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
    let request:UnidadMedidaDTO = {
        nombre: formValue.nombre!,
        alias: formValue.alias!, 
      }
    

      console.log(request)
      this.unidadMedidaService.update(request,formValue.id!).subscribe((resp) => {
// this.display = false;
this.formulario.reset();
this.messageService.clear();
this.router.navigate(['../../'], { relativeTo: this.route });
this.messageService.add({
  key: 'top-right',
  severity: 'success',
  summary: '¡Actualización exitosa!',
  detail: 'Se ha actualizado la unidad de medida correctamente.',
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
