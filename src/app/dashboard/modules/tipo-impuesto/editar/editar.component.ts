import { Component, effect, inject, signal, untracked } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { AppPrimengModule } from '@shared/app-primeng/app-primeng.module';
import { MessageErrorComponent } from '@shared/components/message-error/message-error.component';
import { MessageService } from 'primeng/api';
import { TipoImpuestoApiService } from '../services/tipo-impuesto.api.service';
import { NgTemplateOutlet } from '@angular/common';
import { TipoImpuestoResponseDto } from '../services/dtos/tipo-impuesto.response.dto';
import { StatusBinaryReadOnlyComponent } from '../../../../shared/components/status-binary-read-only/status-binary-read-only.component';
import { alreadyTakenUpdate } from '@core/common/already-taken.validator';

@Component({
  selector: 'app-editar',
  imports: [
    AppPrimengModule,
    ReactiveFormsModule,
    MessageErrorComponent,
    NgTemplateOutlet,
    StatusBinaryReadOnlyComponent,
  ],
  templateUrl: './editar.component.html',
  styleUrl: './editar.component.scss',
})
export class EditarComponent {
  display = false;
  tipoImpuestoApiService = inject(TipoImpuestoApiService);
  itemDto = signal<TipoImpuestoResponseDto | null>(null);
  fb = inject(FormBuilder);
  formulario = this.fb.group({
    nombre: [
      '',
      [Validators.required],
      [
        alreadyTakenUpdate(
          this.tipoImpuestoApiService,
          'nombre',
          this.itemDto,
          '?nombre='
        ),
      ],
    ],  porcentaje: [
      0,
      [Validators.required]
    ],
    status: [false, Validators.required],
  });
  messageService = inject(MessageService);
  constructor() {
    effect(() => {
      if (this.itemDto() !== null) {
        untracked(() => {
          this.formulario.patchValue({
            nombre: this.itemDto()!.nombre,
            porcentaje:this.itemDto()!.porcentaje,
            status: this.itemDto()!.enabled,
          });
        });
      }
    });
  }
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
      .update(
        {
          nombre: this.formulario.getRawValue().nombre!,
          porcentaje:  this.formulario.getRawValue().porcentaje!,
          enabled: this.formulario.getRawValue().status!,
        },
        this.itemDto()!.id
      )
      .subscribe((resp) => {
        this.display = false;
        this.formulario.reset();
        this.messageService.clear();
        this.messageService.add({
          key: 'top-right',
          severity: 'success',
          summary: '¡Actualización exitosa!',
          detail: 'Se ha actualizado el tipo de impuesto',
        });
      });
  }
  handleHide() {
    this.formulario.reset();
  }
}
