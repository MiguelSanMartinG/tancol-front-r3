import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { AppPrimengModule } from '@shared/app-primeng/app-primeng.module';
import { MessageErrorComponent } from '@shared/components/message-error/message-error.component';
import { NgTemplateOutlet } from '@angular/common';
import { HeaderComponent } from '@shared/components/header/header.component';
import { AppSharedModule } from '@shared/app-shared.module';
import { FueraEspecificacionApiService } from '../services/fuera-especificacion.api.service';
import { alreadyTaken } from '@core/common/already-taken.validator';

@Component({
  selector: 'app-editar-fuera-especificacion',
  templateUrl: './editar.component.html',
  imports: [
    AppPrimengModule,
    ReactiveFormsModule,
    MessageErrorComponent,
    NgTemplateOutlet,
    HeaderComponent,
    AppSharedModule,
  ],
})
export class EditarFueraEspecificacionComponent {
  apiService = inject(FueraEspecificacionApiService);
  fb = inject(FormBuilder);
  router = inject(Router);
  route = inject(ActivatedRoute);
  formulario = this.fb.group({
    motivo: ['', [Validators.required],[alreadyTaken(this.apiService, '?motivo=')]],
    tipoRezago: ['', Validators.required],
    id: ['', Validators.required],
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
        motivo: resp.motivo,
        tipoRezago: resp.tipoRezago,
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
    this.apiService
      .update(
        {
          motivo: this.formulario.getRawValue().motivo!,
          tipoRezago: this.formulario.getRawValue().tipoRezago!,
        },
        this.formulario.getRawValue().id!
      )
      .subscribe(() => {
        this.formulario.reset();
        this.messageService.clear();
        this.router.navigate(['../../'], { relativeTo: this.route });
        this.messageService.add({
          key: 'top-right',
          severity: 'success',
          summary: '¡Actualización exitosa!',
          detail: 'Se ha actualizado el concepto',
        });
      });
  }

  handleHide() {
    this.formulario.reset();
  }
}
