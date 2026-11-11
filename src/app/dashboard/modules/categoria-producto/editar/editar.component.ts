import { Component, computed, effect, inject, signal, untracked } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { AppPrimengModule } from '@shared/app-primeng/app-primeng.module';
import { MessageErrorComponent } from '@shared/components/message-error/message-error.component';
import { MessageService } from 'primeng/api';
import { NgTemplateOutlet } from '@angular/common';
import { StatusBinaryReadOnlyComponent } from '../../../../shared/components/status-binary-read-only/status-binary-read-only.component';
import { CategoriaProductoResponseDto } from '../services/dtos/categoria-producto.response.dto';
import { CategoriaProductoApiService } from '../services/categoria-producto.api.service';
import { alreadyTakenUpdate } from '@core/common/already-taken.validator';

@Component({
  selector: 'app-editar',
  imports: [
    AppPrimengModule,
    ReactiveFormsModule,
    MessageErrorComponent,
    NgTemplateOutlet,
    StatusBinaryReadOnlyComponent,
  ],
  templateUrl: './editar.component.html',
  styleUrl: './editar.component.scss',
})
export class EditarComponent {
  display = false;
  categoriaProductoApiService = inject(CategoriaProductoApiService);
  itemDto = signal<CategoriaProductoResponseDto | null>(null);
  fb = inject(FormBuilder);
  formulario = this.fb.group({
    nombre: [
      '',
      [Validators.required],
      [
        alreadyTakenUpdate(
          this.categoriaProductoApiService,
          'nombre',
          this.itemDto,
          '?nombre='
        ),
      ],
    ],
    status: [false, Validators.required],
    categoriaPadreId: [''],
  });
  categoriasPadre = computed(() => {
    const actual = this.itemDto()?.idCategoria;
    const hijos = new Set<string>();
    const pendientes = actual ? [actual] : [];
    while (pendientes.length) {
      const id = pendientes.pop()!;
      this.categoriaProductoApiService.listAll().filter((item) => item.idCategoriaPadre === id).forEach((item) => {
        hijos.add(item.idCategoria);
        pendientes.push(item.idCategoria);
      });
    }
    return this.categoriaProductoApiService.listAll().filter((item) => item.enabled && item.idCategoria !== actual && !hijos.has(item.idCategoria));
  });
  messageService = inject(MessageService);
  constructor() {
    effect(() => {
      if (this.itemDto() !== null) {
        untracked(() => {
          this.formulario.patchValue({
            nombre: this.itemDto()!.nombre,
            status: this.itemDto()!.enabled,
            categoriaPadreId: this.itemDto()!.idCategoriaPadre ?? '',
          });
        });
      }
    });
  }
  submit() {
    if (!this.formulario.valid) {
      this.formulario.markAllAsTouched();
      this.messageService.add({
        key: 'center',
        severity: 'warn',
        summary: '!Precaución!',
        detail: 'Hay campos inválidos o faltan campos por llenar.',
      });
      return;
    }

    this.categoriaProductoApiService
      .update(
        {
          nombre: this.formulario.getRawValue().nombre!,
          enabled: this.formulario.getRawValue().status!,
          ...(this.formulario.getRawValue().categoriaPadreId ? { categoriaPadreId: this.formulario.getRawValue().categoriaPadreId! } : {}),
        },
        this.itemDto()!.idCategoria
      )
      .subscribe((resp) => {
        this.display = false;
        this.formulario.reset();
        this.messageService.clear();
        this.messageService.add({
          key: 'top-right',
          severity: 'success',
          summary: '¡Actualización exitosa!',
          detail: 'Se ha actualizado el almacén',
        });
      });
  }
  handleHide() {
    this.formulario.reset();
  }
}
