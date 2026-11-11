import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AppPrimengModule } from '@shared/app-primeng/app-primeng.module';
import { AppSharedModule } from '@shared/app-shared.module';
import { HeaderComponent } from '@shared/components/header/header.component';
import { MessageErrorComponent } from '@shared/components/message-error/message-error.component';
import { MessageService } from 'primeng/api';
import { TipoEquipoApiService } from '../services/tipo-equipo.api.service';

@Component({
  selector: 'app-tipo-equipo-registrar',
  templateUrl: './registrar.component.html',
  styleUrl: './registrar.component.scss',
  imports: [AppPrimengModule, ReactiveFormsModule, AppSharedModule, HeaderComponent, MessageErrorComponent],
})
export class TipoEquipoRegistrarComponent {
  api = inject(TipoEquipoApiService);
  fb = inject(FormBuilder);
  router = inject(Router);
  route = inject(ActivatedRoute);
  messageService = inject(MessageService);

  formulario = this.fb.group({
    nombre: ['', Validators.required],
    alias: ['', Validators.required],
  });

  guardar() {
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }
    this.api.create(this.formulario.getRawValue() as { nombre: string; alias: string }).subscribe(() => {
      this.messageService.add({ severity: 'success', summary: 'Registro exitoso', detail: 'Se registró el tipo de equipo.' });
      this.router.navigate(['../'], { relativeTo: this.route });
    });
  }
}
