import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AppPrimengModule } from '@shared/app-primeng/app-primeng.module';
import { MessageErrorComponent } from '@shared/components/message-error/message-error.component';
import { HeaderComponent } from '@shared/components/header/header.component';
import { AppSharedModule } from '@shared/app-shared.module';
import { RolApiService } from '../services/rol.api.service';
import { MessageService } from 'primeng/api';
import { alreadyTaken } from '@core/common/already-taken.validator';

@Component({
  selector: 'app-rol-editar',
  templateUrl: './editar.component.html',
  styleUrl: './editar.component.scss',
  imports: [
    AppPrimengModule,
    ReactiveFormsModule,
    MessageErrorComponent,
    HeaderComponent,
    AppSharedModule,
  ],
})
export class EditarRolComponent {
  rolApiService = inject(RolApiService);
  fb = inject(FormBuilder);
  router = inject(Router);
  route = inject(ActivatedRoute);
  messageService = inject(MessageService);

  formulario = this.fb.group({
    roleName: ['', [Validators.required],[alreadyTaken(this.rolApiService,'?name=')]],
    id: [0, Validators.required],
  });

  constructor() {
    this.route.paramMap.subscribe((params) => {
      const id = params.get('id');
      if (id) {
        this.cargarDatos(id);
      }
    });
  }

  cargarDatos(id: string) {
    this.rolApiService.getOne(id).subscribe((resp) => {
      this.formulario.patchValue({
        roleName: resp.name,
        id: resp.id,
      });
    });
  }

  validarRegistros() {
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

    this.rolApiService
      .update({ roleName: this.formulario.getRawValue().roleName! }, this.formulario.getRawValue().id!)
      .subscribe(() => {
        this.formulario.reset();
        this.messageService.clear();
        this.router.navigate(['../../'], { relativeTo: this.route });
        this.messageService.add({
          key: 'top-right',
          severity: 'success',
          summary: '¡Actualización exitosa!',
          detail: 'Se ha actualizado el rol',
        });
      });
  }

  handleHide() {
    this.formulario.reset();
  }
}
