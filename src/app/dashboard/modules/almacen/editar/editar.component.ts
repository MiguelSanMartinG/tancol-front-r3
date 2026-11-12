import { Component, effect, EventEmitter, inject, Output, signal, untracked } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { AppPrimengModule } from '@shared/app-primeng/app-primeng.module';
import { MessageErrorComponent } from '@shared/components/message-error/message-error.component';
import { MessageService } from 'primeng/api';
import { AlmacenApiService } from '../services/almacen.api.service';
import { NgTemplateOutlet } from '@angular/common';
import { AlmacenResponseDto } from '../services/dtos/almacen.response.dto';
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
  @Output() saved = new EventEmitter<void>();
  display = false;
  almacenApiService = inject(AlmacenApiService);
  itemDto = signal<AlmacenResponseDto | null>(null);
  fb = inject(FormBuilder);
  formulario = this.fb.group({
    nombre: [
      '',
      [Validators.required],
      [
        alreadyTakenUpdate(
          this.almacenApiService,
          'nombre',
          this.itemDto,
          '?nombre='
        ),
      ],
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
            status: this.itemDto()!.status,
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

    this.almacenApiService
      .update(
        {
          nombre: this.formulario.getRawValue().nombre!,
          status: this.formulario.getRawValue().status!,
        },
        this.itemDto()!.id
      )
      .subscribe((resp) => {
        this.display = false;
        this.saved.emit();
        this.formulario.reset();
        this.messageService.clear();
        this.messageService.add({
          key: 'top-right',
          severity: 'success',
          summary: '¡Actualización exitosa!',
          detail: 'Se ha actualizado el almacén',
        });
      });
  }
  handleHide() {
    this.formulario.reset();
  }
}
