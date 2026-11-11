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
import { DepartamentoApiService } from '../services/departamento.api.service';

@Component({
  selector: 'app-registrar',
  imports: [
    AppPrimengModule, 
    ReactiveFormsModule, 
    MessageErrorComponent,  
    NgTemplateOutlet,
    HeaderComponent,
    AppSharedModule
  ],
  templateUrl: './registrar.component.html',
  styleUrl: './registrar.component.scss',
})
export class RegistrarComponent {
  DepartamentoApiService = inject(DepartamentoApiService);
  fb = inject(FormBuilder);
    router = inject(Router);
    route = inject(ActivatedRoute);
  
  formulario = this.fb.group({
    nombre: ['', [Validators.required],[alreadyTaken(this.DepartamentoApiService,'?nombre=')]],
    alias: ['', [Validators.required]],
    desc:['']
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
    this.DepartamentoApiService.create({
        nombre: this.formulario.getRawValue().nombre!,
        alias: this.formulario.getRawValue().alias!,
        descripcion:this.formulario.getRawValue().desc!
      })
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
          detail: 'Se ha registrado el Departamento',
        });
      });
  }
  handleHide(){
    this.formulario.reset();
  }

}
