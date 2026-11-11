import { Component, effect, inject, signal, untracked } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { AppPrimengModule } from '@shared/app-primeng/app-primeng.module';
import { MessageErrorComponent } from '@shared/components/message-error/message-error.component';
import { MessageService } from 'primeng/api';
import { NgTemplateOutlet } from '@angular/common';
import { RolApiService } from '../services/rol.api.service';
import { RolResponseDto } from '../services/dtos/rol.response.dto';

@Component({
  selector: 'app-rol-eliminar',
  templateUrl: './eliminar.component.html',
  styleUrl: './eliminar.component.scss',
  imports: [
    AppPrimengModule,
    ReactiveFormsModule,
    MessageErrorComponent,
    NgTemplateOutlet,
  ],
})
export class EliminarRolComponent {
  display = false;
  rolApiService = inject(RolApiService);
  itemDto = signal<RolResponseDto | null>(null);
  fb = inject(FormBuilder);
  formulario = this.fb.group({
    roleName: [{ disabled: true, value: '' }, Validators.required],
  });
  messageService = inject(MessageService);

  constructor() {
    effect(() => {
      if (this.itemDto() !== null) {
        untracked(() => {
          this.formulario.patchValue({ roleName: this.itemDto()!.name });
        });
      }
    });
  }

  submit() {
    this.rolApiService.delete(String(this.itemDto()!.id)).subscribe(() => {
      this.handleHide();
      this.messageService.clear();
      this.messageService.add({
        key: 'top-right',
        severity: 'success',
        summary: 'Eliminación exitosa',
        detail: 'Se ha eliminado el rol',
      });
    });
  }

  handleHide() {
    this.display = false;
    this.formulario.reset();
  }
}
