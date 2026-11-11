import { NgTemplateOutlet } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AppPrimengModule } from '@shared/app-primeng/app-primeng.module';
import { MessageErrorComponent } from '@shared/components/message-error/message-error.component';
import { MessageService } from 'primeng/api';
import { HeaderComponent } from '@shared/components/header/header.component';
import { ActivatedRoute, Router } from '@angular/router';
import { AppSharedModule } from '@shared/app-shared.module';
import { FueraEspecificacionApiService } from '../services/fuera-especificacion.api.service';
import { FueraEspecificacionDto } from '../services/fuera-especificacion-dto';
import { alreadyTaken } from '@core/common/already-taken.validator';

@Component({
  selector: 'app-registrar-fuera-especificacion',
  imports: [
    AppPrimengModule,
    ReactiveFormsModule,
    MessageErrorComponent,
    NgTemplateOutlet,
    HeaderComponent,
    AppSharedModule,
  ],
  templateUrl: './registrar.component.html',
  // styleUrl: './registrar.component.scss',
})
export class RegistrarFueraEspecificacionComponent {
  apiService = inject(FueraEspecificacionApiService);
  fb = inject(FormBuilder);
  router = inject(Router);
  route = inject(ActivatedRoute);

  formulario = this.fb.group({
    motivo: ['', [Validators.required],[alreadyTaken(this.apiService, '?motivo=')]],
    tipoRezago: ['DONADO', [Validators.required]],
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
    const form = this.formulario.getRawValue()
    let request:FueraEspecificacionDto = {
      motivo:form.motivo!,
      tipoRezago:'DONADO'
    }
    this.apiService
      .create(request)
      .subscribe(() => {
        this.formulario.reset({ tipoRezago: 'DONADO' });
        this.messageService.clear();
        this.router.navigate(['../'], { relativeTo: this.route });
        this.messageService.add({
          key: 'top-right',
          severity: 'success',
          summary: '¡Registro exitoso!',
          detail: 'Se ha registrado el concepto',
        });
      });
  }

  handleHide() {
    this.formulario.reset({ tipoRezago: 'DONADO' });
  }
}
