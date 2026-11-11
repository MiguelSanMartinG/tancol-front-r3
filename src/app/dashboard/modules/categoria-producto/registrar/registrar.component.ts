import { Component, computed, inject } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { AppPrimengModule } from '@shared/app-primeng/app-primeng.module';
import { MessageService } from 'primeng/api';
import { CategoriaProductoApiService } from '../services/categoria-producto.api.service';
import { MessageErrorComponent } from '../../../../shared/components/message-error/message-error.component';
import { NgTemplateOutlet } from '@angular/common';
import { HasErrorDirective } from '@shared/components/message-error/has-error.directive';
import { Observable, timer, switchMap, distinctUntilChanged, map } from 'rxjs';
import { alreadyTaken } from '@core/common/already-taken.validator';

@Component({
  selector: 'app-registrar-categoria-producto',
  imports: [AppPrimengModule, ReactiveFormsModule, MessageErrorComponent,  NgTemplateOutlet],
  templateUrl: './registrar.component.html',
  styleUrl: './registrar.component.scss',
})
export class RegistrarCategoriaProductoComponent {
  display = false;
  categoriaProductoApiService = inject(CategoriaProductoApiService);
  fb = inject(FormBuilder);
  formulario = this.fb.group({
    nombre: ['', [ Validators.required] ,[alreadyTaken(this.categoriaProductoApiService,'?nombre=')]],
    categoriaPadreId: [''],
  });
  categoriasPadre = computed(() => this.categoriaProductoApiService.listAll().filter((item) => item.enabled));
  messageService = inject(MessageService);
  submit() {
    if (!this.formulario.valid) {
      this.formulario.markAllAsTouched();
      this.messageService.add({
        key: 'center',
        severity: 'warn',
        summary: '!Precaución!',
        detail: 'Hay campos inválidos o faltan campos por llenar',
      });
      return;
    }

    this.categoriaProductoApiService
      .create({
        nombre: this.formulario.getRawValue().nombre!,
        ...(this.formulario.getRawValue().categoriaPadreId ? { categoriaPadreId: this.formulario.getRawValue().categoriaPadreId! } : {}),
      })
      .subscribe((resp) => {
        this.display = false;
        this.formulario.reset();
        this.messageService.clear();
        this.messageService.add({
          key: 'top-right',
          severity: 'success',
          summary: '¡Registro exitoso!',
          detail: 'Se ha registrado el almacén',
        });
      });
  }
  handleHide(){
    this.formulario.reset();
  }
  
}
