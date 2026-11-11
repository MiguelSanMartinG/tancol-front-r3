import { Component, effect, inject, signal, untracked } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { AppPrimengModule } from '@shared/app-primeng/app-primeng.module';
import { MessageErrorComponent } from '@shared/components/message-error/message-error.component';
import { MessageService } from 'primeng/api';
import { NgTemplateOutlet } from '@angular/common';
import { StatusBinaryReadOnlyComponent } from '@shared/components/status-binary-read-only/status-binary-read-only.component';
import { SistemaAlmacenamientoApiService } from '../services/sistema-almacenamiento.api.service';
import { SistemaAlmacenamientoResponseDto } from '../services/dtos/sistema-almacenamiento.response.dto';

@Component({
  selector: 'app-eliminar',
  imports: [
    AppPrimengModule,
    ReactiveFormsModule,
    MessageErrorComponent,
    NgTemplateOutlet,
    StatusBinaryReadOnlyComponent,
  ],
  templateUrl: './eliminar.component.html',
  styleUrl: './eliminar.component.scss',
})
export class EliminarComponent {
  display = false;
  sistemaAlmacenamientoApiService = inject(SistemaAlmacenamientoApiService);
  itemDto = signal<SistemaAlmacenamientoResponseDto | null>(null);
  fb = inject(FormBuilder);
  formulario = this.fb.group({
    nombre: [{ disabled: true, value: '' }, Validators.required],
    alias: [{ disabled: true, value: '' }, Validators.required],
  });
  messageService = inject(MessageService);
  constructor() {
    effect(() => {
      if (this.itemDto() !== null) {
        untracked(() => {
          this.formulario.patchValue({
            nombre: this.itemDto()!.nombre,
            alias: this.itemDto()!.alias,
          });
        });
      }
    });
  }
  submit() {
    this.sistemaAlmacenamientoApiService
      .delete(this.itemDto()!.id)
      .subscribe(() => {
        this.handleHide();
        this.messageService.clear();
        this.messageService.add({
          key: 'top-right',
          severity: 'success',
          summary: 'Eliminación exitosa',
          detail: 'Se ha eliminado el sistema de almacenamiento',
        });
      });
  }
  handleHide() {
    this.display = false;
    this.formulario.reset();
  }
}
