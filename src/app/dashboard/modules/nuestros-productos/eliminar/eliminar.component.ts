import { Component, EventEmitter, Output, effect, inject, signal, untracked } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { AppPrimengModule } from '@shared/app-primeng/app-primeng.module';
import { MessageErrorComponent } from '@shared/components/message-error/message-error.component';
import { MessageService } from 'primeng/api';
import { NgTemplateOutlet } from '@angular/common';
import { StatusBinaryReadOnlyComponent } from '@shared/components/status-binary-read-only/status-binary-read-only.component';
import { NuestrosProductosService } from '../service/nuestros-productos.service';
import { NuestrosProductosResponse } from '../service/nuestros-productos.response';



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
  nuestrosProductos = inject(NuestrosProductosService);
  itemDto = signal<NuestrosProductosResponse | null>(null);
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
            nombre: this.itemDto()!.nombre
          });
        });
      }
    });
  }
  submit() {
    console.log(this.itemDto());
    this.nuestrosProductos.delete(this.itemDto()!.idProductoComercial).subscribe((resp:any) => {
      this.handleHide();
      this.deleted.emit();
      this.messageService.clear();
      this.messageService.add({
        key: 'top-right',
        severity: 'success',
        summary: 'Eliminación exitosa',
        detail: 'Se ha eliminado nuestro producto correctamente.',
      });
    });
  }
  handleHide() {
    this.display = false;
    this.formulario.reset();
  }
}
