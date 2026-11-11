import { Component, inject, signal, effect, untracked } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AppPrimengModule } from '@shared/app-primeng/app-primeng.module';
import { MessageErrorComponent } from '@shared/components/message-error/message-error.component';
import { MessageService } from 'primeng/api';
import { HeaderComponent } from '@shared/components/header/header.component';
import { LiquidacionApiService } from '../services/liquidacion.api.service';
import { LiquidacionResponse } from '../services/dtos/liquidacion.response.dto';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-editar',
  standalone: true,
  imports: [CommonModule, AppPrimengModule, ReactiveFormsModule, MessageErrorComponent, HeaderComponent],
  templateUrl: './editar.component.html',
  styleUrl: './editar.component.scss',
})
export class EditarComponent {
  display = false;
  liquidacionApi = inject(LiquidacionApiService);
  fb = inject(FormBuilder);
  messageService = inject(MessageService);
  itemDto = signal<LiquidacionResponse | null>(null);

  formulario = this.fb.group({
    fecha: ['', Validators.required],
    bloqueNota: [''],
    comentarios: [''],
  });

  constructor() {
    effect(() => {
      if (this.itemDto()) {
        untracked(() => {
          this.formulario.patchValue({
            fecha: this.itemDto()!.fecha,
            bloqueNota: this.itemDto()!.bloqueNota,
          });
        });
      }
    });
  }

  submit() {
    if (!this.formulario.valid || !this.itemDto()) {
      this.formulario.markAllAsTouched();
      this.messageService.add({
        key: 'center',
        severity: 'warn',
        summary: '¡Precaución!',
        detail: 'Hay campos inválidos o faltan campos por llenar.',
      });
      return;
    }

    const body = {
      ...this.itemDto()!,
      bloqueNota: this.formulario.get('bloqueNota')!.value ?? '',
      fecha: this.formulario.get('fecha')!.value ?? '',
      comentarios: this.formulario.get('comentarios')!.value ?? '',
    } as any;

    this.liquidacionApi.update(body, this.itemDto()!.idLiquidacion).subscribe(() => {
      this.messageService.add({
        key: 'top-right',
        severity: 'success',
        summary: '¡Actualización exitosa!',
        detail: 'Se ha actualizado la liquidación',
      });
      this.handleHide();
    });
  }

  handleHide() {
    this.display = false;
    this.formulario.reset();
  }
}
