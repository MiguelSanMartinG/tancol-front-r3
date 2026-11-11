import { Component, effect, inject, signal, untracked } from '@angular/core';
import { ReactiveFormsModule, FormBuilder } from '@angular/forms';
import { AppPrimengModule } from '@shared/app-primeng/app-primeng.module';
import { MessageService } from 'primeng/api';
import { TipoEquipoApiService } from '../services/tipo-equipo.api.service';
import { TipoEquipoResponse } from '../services/tipo-equipo.response';

@Component({
  selector: 'app-tipo-equipo-eliminar',
  templateUrl: './eliminar.component.html',
  styleUrl: './eliminar.component.scss',
  imports: [AppPrimengModule, ReactiveFormsModule],
})
export class TipoEquipoEliminarComponent {
  api = inject(TipoEquipoApiService);
  messageService = inject(MessageService);
  fb = inject(FormBuilder);
  item = signal<TipoEquipoResponse | null>(null);
  display = false;
  formulario = this.fb.group({ nombre: [''], alias: [''] });

  constructor() {
    effect(() => {
      const item = this.item();
      if (item) untracked(() => this.formulario.patchValue(item));
    });
  }

  confirmar() {
    const item = this.item();
    if (!item) return;
    this.api.delete(item.id).subscribe(() => {
      this.display = false;
      this.messageService.add({ severity: 'success', summary: 'Eliminación exitosa', detail: 'Se eliminó el tipo de equipo.' });
    });
  }

  cerrar() {
    this.display = false;
    this.formulario.reset();
  }
}
