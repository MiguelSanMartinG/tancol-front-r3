import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AppPrimengModule } from '@shared/app-primeng/app-primeng.module';
import { MessageService } from 'primeng/api';
import { TipoImpuestoApiService } from '../services/tipo-impuesto.api.service';
import { MessageErrorComponent } from '../../../../shared/components/message-error/message-error.component';
import { NgTemplateOutlet } from '@angular/common';
import { alreadyTaken } from '@core/common/already-taken.validator';

@Component({
  selector: 'app-registrar-tipo-impuesto',
  imports: [AppPrimengModule, ReactiveFormsModule, MessageErrorComponent,  NgTemplateOutlet],
  templateUrl: './registrar.component.html',
  styleUrl: './registrar.component.scss',
})
export class RegistrarTipoImpuestoComponent {
  display = false;
  tipoImpuestoApiService = inject(TipoImpuestoApiService);
  fb = inject(FormBuilder);
  formulario = this.fb.group({
    nombre: ['', [Validators.required],[alreadyTaken(this.tipoImpuestoApiService,'?nombre=')]],
    porcentaje: [0, [Validators.required],[]],
  });
  messageService = inject(MessageService);
  submit() {
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

    this.tipoImpuestoApiService
      .create({
        nombre: this.formulario.getRawValue().nombre!,
        porcentaje: this.formulario.getRawValue().porcentaje!
      })
      .subscribe((resp) => {
        this.display = false;
        this.formulario.reset();
        this.messageService.clear();
        this.messageService.add({
          key: 'top-right',
          severity: 'success',
          summary: '¡Registro exitoso!',
          detail: 'Se ha registrado el tipo de impuesto',
        });
      });
  }
  handleHide(){
    this.formulario.reset();
  }
}
