import { Component, effect, inject, signal, untracked } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AppPrimengModule } from '@shared/app-primeng/app-primeng.module';
import { MessageErrorComponent } from '@shared/components/message-error/message-error.component';
import { MessageService } from 'primeng/api';
import { NgTemplateOutlet } from '@angular/common';
import { StatusBinaryReadOnlyComponent } from '@shared/components/status-binary-read-only/status-binary-read-only.component';
import { ModuloApiService } from '../services/modulo.api.service';
import { ModuloResponseDto } from '../services/dtos/modulo.response.dto';

@Component({
  selector: 'app-eliminar-modulo',
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
  moduloApiService = inject(ModuloApiService);
  itemDto = signal<ModuloResponseDto | null>(null);
  fb = inject(FormBuilder);
  formulario = this.fb.group({
    name: [{ disabled: true, value: '' }, Validators.required],
  });
  messageService = inject(MessageService);
  constructor() {
    effect(() => {
      if (this.itemDto() !== null) {
        untracked(() => {
          this.formulario.patchValue({
            name: this.itemDto()!.name,
          });
        });
      }
    });
  }
  submit() {
    this.moduloApiService.delete(this.itemDto()!.idModulo).subscribe(() => {
      this.handleHide();
      this.messageService.clear();
      this.messageService.add({
        key: 'top-right',
        severity: 'success',
        summary: 'Eliminación exitosa',
        detail: 'Se ha eliminado el módulo',
      });
    });
  }
  handleHide() {
    this.display = false;
    this.formulario.reset();
  }
}
