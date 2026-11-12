import { Component, EventEmitter, Output, effect, inject, signal, untracked } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { AppPrimengModule } from '@shared/app-primeng/app-primeng.module';
import { MessageErrorComponent } from '@shared/components/message-error/message-error.component';
import { MessageService } from 'primeng/api';
import { ProductoApiService } from '../services/producto.api.service';
import { NgTemplateOutlet } from '@angular/common';
import { ProductoResponseDto } from '../services/dtos/producto.response.dto';
import { StatusBinaryReadOnlyComponent } from '@shared/components/status-binary-read-only/status-binary-read-only.component';

@Component({
  selector: 'app-eliminar',
  imports: [
    AppPrimengModule,
    ReactiveFormsModule,
    MessageErrorComponent,
    NgTemplateOutlet,
  ],
  templateUrl: './eliminar.component.html',
  styleUrl: './eliminar.component.scss',
})
export class EliminarComponent {
  @Output() deleted = new EventEmitter<void>();
  display = false;
  isUpload = false;
  productoApiService = inject(ProductoApiService);
  itemDto = signal<ProductoResponseDto | null>(null);
  fb = inject(FormBuilder);
  formulario = this.fb.group({
    nombre: ['', Validators.required],
    sku: [''],
    alias: [''],
    descripcion: [''],
    image: [{
      file: null,
      url: null
    },],
  });
  messageService = inject(MessageService);
  constructor() {
    effect(() => {
      if (this.itemDto() !== null) {
        untracked(() => {
          this.formulario.patchValue({
            nombre: this.itemDto()!.nombre,
            sku: this.itemDto()!.sku,
            alias: this.itemDto()!.alias,
            descripcion: this.itemDto()!.descripcion,
            image: {
              file: null,
              url: null
            },
          });
          this.formulario.disable();
        });
      }
    });
  }
  submit() {
    console.log(this.itemDto());
    this.productoApiService.delete(this.itemDto()!.idProducto).subscribe((resp) => {
      this.handleHide();
      this.deleted.emit();
      this.messageService.clear();
      this.messageService.add({
        key: 'top-right',
        severity: 'success',
        summary: 'Eliminación exitosa',
        detail: 'Se ha eliminado el insumo correctamente.',
      });
    });
  }
  handleHide() {
    this.display = false;
    this.formulario.reset();
  }
}
