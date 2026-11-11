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
  selector: 'app-rol-registrar',
  templateUrl: './registrar.component.html',
  styleUrl: './registrar.component.scss',
  imports: [
    AppPrimengModule,
    ReactiveFormsModule,
    MessageErrorComponent,
    HeaderComponent,
    AppSharedModule,
  ],
})
export class RegistrarRolComponent {
  rolApiService = inject(RolApiService);
  fb = inject(FormBuilder);
  router = inject(Router);
  route = inject(ActivatedRoute);
  messageService = inject(MessageService);

  formulario = this.fb.group({
    roleName: ['', [Validators.required],[alreadyTaken(this.rolApiService,'?name=')]],
  });

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
      .create({ roleName: this.formulario.getRawValue().roleName! })
      .subscribe(() => {
        this.formulario.reset();
        this.messageService.clear();
        this.router.navigate(['../'], { relativeTo: this.route });
        this.messageService.add({
          key: 'top-right',
          severity: 'success',
          summary: '¡Registro exitoso!',
          detail: 'Se ha registrado el rol',
        });
      });
  }

  handleHide() {
    this.formulario.reset();
  }
}
