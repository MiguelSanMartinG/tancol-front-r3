import { Component, effect, inject, signal, untracked } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { AppPrimengModule } from '@shared/app-primeng/app-primeng.module';
import { MessageErrorComponent } from '@shared/components/message-error/message-error.component';
import { MessageService } from 'primeng/api';
import { NgTemplateOutlet } from '@angular/common';
import { FueraEspecificacionApiService } from '../services/fuera-especificacion.api.service';
import { FueraEspecificacionResponse } from '../services/fuera-especificacion-response';

@Component({
  selector: 'app-eliminar-fuera-especificacion',
  imports: [
    AppPrimengModule,
    ReactiveFormsModule,
    MessageErrorComponent,
    NgTemplateOutlet,
  ],
  templateUrl: './eliminar.component.html',
})
export class EliminarFueraEspecificacionComponent {
  display = false;
  apiService = inject(FueraEspecificacionApiService);
  itemDto = signal<FueraEspecificacionResponse | null>(null);
  fb = inject(FormBuilder);
  formulario = this.fb.group({
    motivo: [{ disabled: true, value: '' }, Validators.required],
    tipoRezago: [{ disabled: true, value: '' }, Validators.required],
  });
  messageService = inject(MessageService);
  constructor() {
    effect(() => {
      if (this.itemDto() !== null) {
        untracked(() => {
          this.formulario.patchValue({
            motivo: this.itemDto()!.motivo,
            tipoRezago: this.itemDto()!.tipoRezago,
          });
        });
      }
    });
  }
  submit() {
    this.apiService.delete(this.itemDto()!.id).subscribe(() => {
      this.handleHide();
      this.messageService.clear();
      this.messageService.add({
        key: 'top-right',
        severity: 'success',
        summary: 'Eliminación exitosa',
        detail: 'Se ha eliminado el concepto',
      });
    });
  }
  handleHide() {
    this.display = false;
    this.formulario.reset();
  }
}
