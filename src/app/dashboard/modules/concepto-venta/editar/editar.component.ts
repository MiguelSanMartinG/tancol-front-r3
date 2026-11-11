import { NgTemplateOutlet } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { AppPrimengModule } from '@shared/app-primeng/app-primeng.module';
import { MessageErrorComponent } from '@shared/components/message-error/message-error.component';
import { HeaderComponent } from '@shared/components/header/header.component';
import { AppSharedModule } from '@shared/app-shared.module';
import { ConceptoVentaApiService } from '../services/concepto-venta.api.service';
import { alreadyTakenUpdate } from '@core/common/already-taken.validator';
import { StatusBinaryReadOnlyComponent } from '@shared/components/status-binary-read-only/status-binary-read-only.component';
import { ConceptoVentaCreateDto } from '../services/dtos/concepto-venta.create.dto';

@Component({
  selector: 'app-editar-concepto-venta',
  templateUrl: './editar.component.html',
  imports: [
    AppPrimengModule,
    ReactiveFormsModule,
    MessageErrorComponent,
    NgTemplateOutlet,
    HeaderComponent,
    AppSharedModule,
    StatusBinaryReadOnlyComponent,
  ],
})
export class EditarConceptoVentaComponent {
  apiService = inject(ConceptoVentaApiService);
  fb = inject(FormBuilder);
  router = inject(Router);
  route = inject(ActivatedRoute);

  formulario = this.fb.group({
    concepto: ['', [Validators.required]],
    name: ['', [Validators.required]],
    descuento: [false],
    enabled: [true],
    exclude: [false],
    cancelar: [false],
    id: ['', [Validators.required]],
  });
  messageService = inject(MessageService);

  constructor() {
    this.route.paramMap.subscribe((params) => {
      const id = params.get('id');
      if (id) {
        this.cargarDatos(id);
      }
    });
  }

  cargarDatos(id: string) {
    this.apiService.getOne(id).subscribe((resp) => {
      this.formulario.patchValue({
        concepto: resp.concepto,
        name: resp.name,
        descuento: resp.descuento,
        enabled: resp.enabled,
        exclude: resp.exclude,
        cancelar: resp.cancelado,
        id: resp.id,
      });
    });
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
    const form = this.formulario.getRawValue();

    const request:ConceptoVentaCreateDto = {
      concepto: form.concepto!,
      descuento: form.descuento!,
      exclude: form.exclude!,
      enabled: form.enabled!,
      cancelado: form.cancelar!,
      x:true,
      name: form.name!
    }

    this.apiService.update(request, form.id!).subscribe(() => {
      this.formulario.reset({ descuento: false, enabled: true, exclude: false });
      this.messageService.clear();
      this.router.navigate(['../../'], { relativeTo: this.route });
      this.messageService.add({
        key: 'top-right',
        severity: 'success',
        summary: '¡Actualización exitosa!',
        detail: 'Se ha actualizado el concepto de venta',
      });
    });
  }

  handleHide() {
    this.formulario.reset({ descuento: false, enabled: true, exclude: false });
  }
}
