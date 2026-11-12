import { NgTemplateOutlet } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { alreadyTaken } from '@core/common/already-taken.validator';
import { AppPrimengModule } from '@shared/app-primeng/app-primeng.module';
import { MessageErrorComponent } from '@shared/components/message-error/message-error.component';
import { HeaderComponent } from '@shared/components/header/header.component';
import { AppSharedModule } from '@shared/app-shared.module';
import { MessageService } from 'primeng/api';
import { switchMap } from 'rxjs';
import { FormComponent } from '../form/form.component';
import { MedidorApiService } from '../services/medidor.api.service';
import { MedidorCreateDto } from '../services/dtos/medidor.create.dto';

@Component({
  selector: 'app-registrar-medidor-hijo',
  standalone: true,
  imports: [
    AppPrimengModule,
    ReactiveFormsModule,
    MessageErrorComponent,
    NgTemplateOutlet,
    HeaderComponent,
    AppSharedModule,
    FormComponent,
  ],
  templateUrl: './registrar-hijo.component.html',
})
export class RegistrarHijoComponent {
  medidorApi = inject(MedidorApiService);
  fb = inject(FormBuilder);
  router = inject(Router);
  route = inject(ActivatedRoute);
  messageService = inject(MessageService);

  idPadre = this.route.snapshot.params['id'];

  formulario = this.fb.group({
    nombre: ['', [Validators.required], [alreadyTaken(this.medidorApi, '?nombre=')]],
    alias: ['', [Validators.required]],
    idsSistemasAlmacenamiento: [[], [Validators.required]],
    unidadMedicion: ['', [Validators.required]],
    medicionInicial: [0, [Validators.required, Validators.min(0)]],
    tipoAgua: ['POTABLE', [Validators.required]],
  });

  validarRegistros() {
    if (!this.formulario.valid) {
      this.formulario.markAllAsTouched();
      this.messageService.add({
        key: 'center',
        severity: 'warn',
        summary: '!Precaucion!',
        detail: 'Hay campos invalidos o faltan campos por llenar.',
      });
      return;
    }
    const form = this.formulario.getRawValue();
    const request: MedidorCreateDto = {
      nombre: form.nombre!,
      alias: form.alias!,
      idsSistemasAlmacenamiento: form.idsSistemasAlmacenamiento!,
      unidadMedicion: form.unidadMedicion!,
      medicionInicial: parseFloat(form.medicionInicial as any) / 1000,
      tipoAgua: form.tipoAgua as any,
    };
    this.medidorApi
      .create(request)
      .pipe(
        switchMap((resp) =>
          this.medidorApi.crearRelacion({
            idMedidorHijo: resp.idMedidor,
            idMedidorPadre: this.idPadre,
          })
        )
      )
      .subscribe(() => {
        this.formulario.reset();
        this.messageService.clear();
        this.router.navigate(['../'], { relativeTo: this.route });
        this.messageService.add({
          key: 'top-right',
          severity: 'success',
          summary: 'Registro exitoso!',
          detail: 'Se ha registrado el medidor',
        });
      });
  }

  handleHide() {
    this.formulario.reset();
  }
}
