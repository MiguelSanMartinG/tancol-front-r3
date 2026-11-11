import { Component, effect, inject, signal, untracked } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { AppPrimengModule } from '@shared/app-primeng/app-primeng.module';
import { MessageErrorComponent } from '@shared/components/message-error/message-error.component';
import { MessageService } from 'primeng/api';
import { NgTemplateOutlet } from '@angular/common';
import { StatusBinaryReadOnlyComponent } from '@shared/components/status-binary-read-only/status-binary-read-only.component';
import { TipoClienteApiService } from '../services/tipo-cliente.api.service';
import { TipoClienteResponse } from '../services/tipo-cliente-response';

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
  tipoEmpleadoApiService = inject(TipoClienteApiService);
  itemDto = signal<TipoClienteResponse | null>(null);
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
    this.tipoEmpleadoApiService.delete(this.itemDto()!.idTiposClientes).subscribe((resp) => {
      this.handleHide();
      this.messageService.clear();
      this.messageService.add({
        key: 'top-right',
        severity: 'success',
        summary: 'Eliminación exitosa',
        detail: 'Se ha eliminado el tipo de cliente',
      });
    });
  }
  handleHide() {
    this.display = false;
    this.formulario.reset();
  }
}
