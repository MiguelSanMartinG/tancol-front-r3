import { Component, EventEmitter, Output, effect, inject, signal, untracked } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { NgTemplateOutlet } from '@angular/common';
import { AppPrimengModule } from '@shared/app-primeng/app-primeng.module';
import { MessageErrorComponent } from '@shared/components/message-error/message-error.component';
import { StatusBinaryReadOnlyComponent } from '@shared/components/status-binary-read-only/status-binary-read-only.component';
import { MessageService } from 'primeng/api';
import { MedidorApiService } from '../services/medidor.api.service';
import { MedidorResponseDto } from '../services/dtos/medidor.response.dto';

@Component({
  selector: 'app-eliminar-medidor',
  standalone: true,
  imports: [
    AppPrimengModule,
    ReactiveFormsModule,
    MessageErrorComponent,
    NgTemplateOutlet,
    StatusBinaryReadOnlyComponent,
  ],
  templateUrl: './eliminar.component.html',
})
export class EliminarComponent {
  display = false;
  @Output() deleted = new EventEmitter<void>();
  medidorApi = inject(MedidorApiService);
  itemDto = signal<MedidorResponseDto | null>(null);
  fb = inject(FormBuilder);
  formulario = this.fb.group({
    idMedidor: [{ disabled: true, value: '' }, Validators.required],
  });
  messageService = inject(MessageService);
  constructor() {
    effect(() => {
      if (this.itemDto() !== null) {
        untracked(() => {
          this.formulario.patchValue({
            idMedidor: this.itemDto()!.idMedidor,
          });
        });
      }
    });
  }
  submit() {
    this.medidorApi.delete(this.itemDto()!.idMedidor).subscribe(() => {
      this.handleHide();
      this.deleted.emit();
      this.messageService.clear();
      this.messageService.add({
        key: 'top-right',
        severity: 'success',
        summary: 'Eliminación exitosa',
        detail: 'Se ha eliminado el medidor',
      });
    });
  }
  handleHide() {
    this.display = false;
    this.formulario.reset();
  }
}
