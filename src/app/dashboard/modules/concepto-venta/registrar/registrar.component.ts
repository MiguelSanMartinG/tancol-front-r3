import { NgTemplateOutlet } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AppPrimengModule } from '@shared/app-primeng/app-primeng.module';
import { MessageErrorComponent } from '@shared/components/message-error/message-error.component';
import { MessageService } from 'primeng/api';
import { HeaderComponent } from '@shared/components/header/header.component';
import { ActivatedRoute, Router } from '@angular/router';
import { AppSharedModule } from '@shared/app-shared.module';
import { ConceptoVentaApiService } from '../services/concepto-venta.api.service';
import { alreadyTaken } from '@core/common/already-taken.validator';
import { ConceptoVentaCreateDto } from '../services/dtos/concepto-venta.create.dto';

@Component({
  selector: 'app-registrar-concepto-venta',
  imports: [
    AppPrimengModule,
    ReactiveFormsModule,
    MessageErrorComponent,
    NgTemplateOutlet,
    HeaderComponent,
    AppSharedModule,
  ],
  templateUrl: './registrar.component.html',
})
export class RegistrarConceptoVentaComponent {
  apiService = inject(ConceptoVentaApiService);
  fb = inject(FormBuilder);
  router = inject(Router);
  route = inject(ActivatedRoute);

  formulario = this.fb.group({
    concepto: ['', [Validators.required],[alreadyTaken(this.apiService, '?concepto=')]],
    name: ['', [],[alreadyTaken(this.apiService, '?name=')]],
    descuento: [false],
    cancelar: [false],
    enabled: [true],
    exclude: [false],
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

    let form = this.formulario.getRawValue()
    const request:ConceptoVentaCreateDto = {
      concepto: form.concepto!,
      descuento: form.descuento!,
      exclude: form.exclude!,
      cancelado: form.cancelar!,
      x: true,
      enabled: true,
      name: form.concepto!
    }

    this.apiService
      .create(request)
      .subscribe(() => {
        this.formulario.reset({ descuento: false, enabled: true, exclude: false });
        this.messageService.clear();
        this.router.navigate(['../'], { relativeTo: this.route });
        this.messageService.add({
          key: 'top-right',
          severity: 'success',
          summary: '¡Registro exitoso!',
          detail: 'Se ha registrado el concepto de venta',
        });
      });
  }

  handleHide() {
    this.formulario.reset({ descuento: false, enabled: true, exclude: false });
  }
}
