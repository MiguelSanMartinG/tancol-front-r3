import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AppPrimengModule } from '@shared/app-primeng/app-primeng.module';
import { MessageErrorComponent } from '@shared/components/message-error/message-error.component';
import { HeaderComponent } from '@shared/components/header/header.component';
import { AppSharedModule } from '@shared/app-shared.module';
import { ModuloApiService } from '../services/modulo.api.service';
import { MessageService } from 'primeng/api';
import { ModuloCreateDto } from '../services/dtos/modulo.create.dto';

@Component({
  selector: 'app-modulo-registrar',
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
export class RegistrarModuloComponent implements OnInit {
  moduloApiService = inject(ModuloApiService);
  fb = inject(FormBuilder);
  router = inject(Router);
  route = inject(ActivatedRoute);
  messageService = inject(MessageService);

  formulario = this.fb.group({
    name: ['', Validators.required],
    rutaModulo: ['', Validators.required],
    parentId: [''],
  });

  modulosDisponibles: any[] = [];

  ngOnInit(): void {
    this.moduloApiService.getAll().subscribe((resp) => {
      this.modulosDisponibles = resp;
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

    let form = this.formulario.getRawValue()
    let request:ModuloCreateDto = {
      name:form.name!,
      rutaModulo:form.rutaModulo!,
      parentId:form.parentId!
    }

    this.moduloApiService.create(request).subscribe(() => {
      this.formulario.reset();
      this.messageService.clear();
      this.router.navigate(['../'], { relativeTo: this.route });
      this.messageService.add({
        key: 'top-right',
        severity: 'success',
        summary: '¡Registro exitoso!',
        detail: 'Se ha registrado el módulo',
      });
    });
  }

  handleHide() {
    this.formulario.reset();
  }
}
