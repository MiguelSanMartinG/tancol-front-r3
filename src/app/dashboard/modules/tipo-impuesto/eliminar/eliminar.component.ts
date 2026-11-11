import { Component, effect, inject, signal, untracked } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { AppPrimengModule } from '@shared/app-primeng/app-primeng.module';
import { MessageErrorComponent } from '@shared/components/message-error/message-error.component';
import { MessageService } from 'primeng/api';
import { TipoImpuestoApiService } from '../services/tipo-impuesto.api.service';
import { NgTemplateOutlet } from '@angular/common';
import { TipoImpuestoResponseDto } from '../services/dtos/tipo-impuesto.response.dto';
import { StatusBinaryReadOnlyComponent } from '@shared/components/status-binary-read-only/status-binary-read-only.component';

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
  tipoImpuestoApiService = inject(TipoImpuestoApiService);
  itemDto = signal<TipoImpuestoResponseDto | null>(null);
  fb = inject(FormBuilder);
  formulario = this.fb.group({
    nombre: [{ disabled: true, value: '' }, Validators.required],
    status: [{ disabled: true, value: false }, Validators.required],
  });
  messageService = inject(MessageService);
  constructor() {
    effect(() => {
      if (this.itemDto() !== null) {
        untracked(() => {
          this.formulario.patchValue({
            nombre: this.itemDto()!.nombre,
            status: this.itemDto()!.enabled,
          });
        });
      }
    });
  }
  submit() {
    this.tipoImpuestoApiService.delete(this.itemDto()!.id).subscribe((resp) => {
      this.handleHide();
      this.messageService.clear();
      this.messageService.add({
        key: 'top-right',
        severity: 'success',
        summary: 'Eliminación exitosa',
        detail: 'Se ha eliminado el tipo de impuesto',
      });
    });
  }
  handleHide() {
    this.display = false;
    this.formulario.reset();
  }
}
