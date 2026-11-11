import { Component, effect, inject, signal, untracked } from '@angular/core';
import { ReactiveFormsModule, FormBuilder } from '@angular/forms';
import { AppPrimengModule } from '@shared/app-primeng/app-primeng.module';
import { MessageErrorComponent } from '@shared/components/message-error/message-error.component';
import { MessageService } from 'primeng/api';
import { NgTemplateOutlet } from '@angular/common';
import { StatusBinaryReadOnlyComponent } from '@shared/components/status-binary-read-only/status-binary-read-only.component';
import { ConceptoVentaApiService } from '../services/concepto-venta.api.service';
import { ConceptoVentaResponseDto } from '../services/dtos/concepto-venta.response.dto';

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
})
export class EliminarComponent {
  display = false;
  apiService = inject(ConceptoVentaApiService);
  itemDto = signal<ConceptoVentaResponseDto | null>(null);
  fb = inject(FormBuilder);
  formulario = this.fb.group({
    concepto: [{ value: '', disabled: true }],
    name: [{ value: '', disabled: true }],
    descuento: [{ value: false, disabled: true }],
    enabled: [{ value: false, disabled: true }],
    exclude: [{ value: false, disabled: true }],
  });
  messageService = inject(MessageService);
  constructor() {
    effect(() => {
      if (this.itemDto() !== null) {
        untracked(() => {
          this.formulario.patchValue({
            concepto: this.itemDto()!.concepto,
            name: this.itemDto()!.name,
            descuento: this.itemDto()!.descuento,
            enabled: this.itemDto()!.enabled,
            exclude: this.itemDto()!.exclude,
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
        detail: 'Se ha eliminado el concepto de venta',
      });
    });
  }
  handleHide() {
    this.display = false;
    this.formulario.reset();
  }
}
