import { Component, effect, EventEmitter, inject, Output, signal, untracked } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { AppPrimengModule } from '@shared/app-primeng/app-primeng.module';
import { MessageErrorComponent } from '@shared/components/message-error/message-error.component';
import { MessageService } from 'primeng/api';
import { ProveedorApiService } from '../services/proveedor.api.service';
import { NgTemplateOutlet } from '@angular/common';
import { StatusBinaryReadOnlyComponent } from '@shared/components/status-binary-read-only/status-binary-read-only.component';
import { ProveedorResponseDto } from '../services/dtos/proveedor.response.dto';

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
  @Output() deleted = new EventEmitter<void>();
  display = false;
  proveedorApiService = inject(ProveedorApiService);
  itemDto = signal<ProveedorResponseDto | null>(null);
  fb = inject(FormBuilder);
  formulario = this.fb.group({
    nombreComercial: [{ disabled: true, value: '' }, Validators.required],
    rfc: [{ disabled: true, value: '' }, Validators.required],
  });
  messageService = inject(MessageService);
  constructor() {
    effect(() => {
      if (this.itemDto() !== null) {
        untracked(() => {
          this.formulario.patchValue({
            nombreComercial: this.itemDto()!.nombreComercial,
            rfc:this.itemDto()!.infoFiscal.rfc,
          });
        });
      }
    });
  }
  submit() {
    this.proveedorApiService.delete(this.itemDto()!.idProveedor).subscribe((resp) => {
      this.handleHide();
      this.messageService.clear();
      this.messageService.add({
        key: 'top-right',
        severity: 'success',
        summary: 'Eliminación exitosa',
        detail: 'Se ha eliminado el proveedor',
      });
      this.proveedorApiService.getAll().subscribe();
      this.deleted.emit();
    });
  }
  handleHide() {
    this.display = false;
    this.formulario.reset();
  }
}
