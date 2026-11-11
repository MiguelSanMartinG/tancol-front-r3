import { Component, effect, inject, signal, untracked } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { AppPrimengModule } from '@shared/app-primeng/app-primeng.module';
import { MessageErrorComponent } from '@shared/components/message-error/message-error.component';
import { MessageService } from 'primeng/api';
import { NgTemplateOutlet } from '@angular/common';
import { StatusBinaryReadOnlyComponent } from '@shared/components/status-binary-read-only/status-binary-read-only.component';
import { InventarioInicialResponse } from '../services/inventario-inicia.response';
import { InventarioInicialService } from '../services/inventario-inicial.service';



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
  inventarioInicialApi = inject(InventarioInicialService);
  itemDto = signal<InventarioInicialResponse | null>(null);
  fb = inject(FormBuilder);
  formulario = this.fb.group({
    nombre: [{ disabled: true, value: '' }, Validators.required],
    producto: [{ disabled: true, value: '' }, Validators.required],
        cantidad: [{ disabled: true, value: 0 }, Validators.required],

  });
  messageService = inject(MessageService);
  constructor() {
    effect(() => {
      if (this.itemDto() !== null) {
        untracked(() => {
          this.formulario.patchValue({
            nombre: this.itemDto()!.almacen.nombre,
            producto:this.itemDto()!.producto.nombre,
            cantidad:this.itemDto()!.cantidad
          });
        });
      }
    });
  }
  submit() {
    console.log(this.itemDto());
    this.inventarioInicialApi.delete(this.itemDto()!.idInventario).subscribe((resp:any) => {
      this.handleHide();
      this.messageService.clear();
      this.messageService.add({
        key: 'top-right',
        severity: 'success',
        summary: 'Eliminación exitosa',
        detail: 'Se ha eliminado el inventario',
      });
    });
  }
  handleHide() {
    this.display = false;
    this.formulario.reset();
  }
}
