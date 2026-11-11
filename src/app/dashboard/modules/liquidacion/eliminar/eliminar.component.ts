import { Component, effect, inject, signal, untracked } from '@angular/core';
import { ReactiveFormsModule, FormBuilder } from '@angular/forms';
import { AppPrimengModule } from '@shared/app-primeng/app-primeng.module';
import { MessageErrorComponent } from '@shared/components/message-error/message-error.component';
import { MessageService } from 'primeng/api';
import { LiquidacionApiService } from '../services/liquidacion.api.service';
import { LiquidacionResponse } from '../services/dtos/liquidacion.response.dto';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-eliminar',
  standalone: true,
  imports: [CommonModule, AppPrimengModule, ReactiveFormsModule, MessageErrorComponent],
  templateUrl: './eliminar.component.html',
  styleUrl: './eliminar.component.scss',
})
export class EliminarComponent {
  display = false;
  liquidacionApi = inject(LiquidacionApiService);
  itemDto = signal<LiquidacionResponse | null>(null);
  fb = inject(FormBuilder);
  messageService = inject(MessageService);

  formulario = this.fb.group({});

  submit() {
    if (!this.itemDto()) {
      return;
    }
    this.liquidacionApi.delete(this.itemDto()!.idLiquidacion).subscribe(() => {
      this.handleHide();
      this.messageService.add({
        key: 'top-right',
        severity: 'success',
        summary: '¡Eliminación exitosa!',
        detail: 'Se ha eliminado la liquidación',
      });
    });
  }

  handleHide() {
    this.display = false;
    this.formulario.reset();
  }
}
