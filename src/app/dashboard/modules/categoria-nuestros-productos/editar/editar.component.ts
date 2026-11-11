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
import { CategoriaNuestrosProductosApiService } from '../service/categoria-nuestros-productos-api.service';
import { CategoriaNuestrosProductosResponse } from '../service/categoria-nuestros-productos.response';
import { CategoriaNuestrosProductosDTO } from '../service/categoria-nuestros-productos.dto';


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
  categoriaNuestrosProductosApiService = inject(CategoriaNuestrosProductosApiService);
    fb = inject(FormBuilder);
    router = inject(Router);
    route = inject(ActivatedRoute);
  formulario = this.fb.group({
    nombre: ['', [Validators.required],[]],
    enabled: [true, [Validators.required]],
    id:['',[Validators.required]]
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
      this.categoriaNuestrosProductosApiService.getOne(id).subscribe((resp)=>{
        console.log(resp);

        this.formulario.patchValue({
          nombre:resp.nombre,
          enabled: resp.enabled,
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
    let request:CategoriaNuestrosProductosDTO = {
      nombre: formValue.nombre!,
      enabled:formValue.enabled ?? true,
      }
    

      console.log(request)
      this.categoriaNuestrosProductosApiService.update(request,formValue.id!).subscribe((resp) => {
// this.display = false;
this.formulario.reset();
this.messageService.clear();
this.router.navigate(['../../'], { relativeTo: this.route });
this.messageService.add({
  key: 'top-right',
  severity: 'success',
  summary: '¡Actualización exitosa!',
  detail: 'Se ha actualizado la categoría de nuestros productos correctamente.',
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
