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
import { UnidadMedidaService } from '../service/unidad-medida.service';
import { UnidadMedidaDTO } from '../service/unidad-medida.dto';

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
  unidadMedidaService = inject(UnidadMedidaService);
  fb = inject(FormBuilder);
    router = inject(Router);
    route = inject(ActivatedRoute);
  
  formulario = this.fb.group({
    nombre: ['', [Validators.required],[alreadyTaken(this.unidadMedidaService,'?nombre=')]],
    alias: ['', [Validators.required]],
  });
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
    console.log(formValue);

    let request:UnidadMedidaDTO = {
      nombre: formValue.nombre!,
      alias: formValue.alias!, 
      }
    

    this.unidadMedidaService.create(request)
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
          detail: 'Se ha registrado el tipo de unidad de medida correctamente.',
        });
      });
  }
  handleHide(){
    this.formulario.reset();
  }

}
