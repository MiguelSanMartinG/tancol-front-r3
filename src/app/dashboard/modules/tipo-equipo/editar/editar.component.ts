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
  selector: 'app-tipo-equipo-editar',
  templateUrl: './editar.component.html',
  styleUrl: './editar.component.scss',
  imports: [AppPrimengModule, ReactiveFormsModule, AppSharedModule, HeaderComponent, MessageErrorComponent],
})
export class TipoEquipoEditarComponent {
  api = inject(TipoEquipoApiService);
  fb = inject(FormBuilder);
  router = inject(Router);
  route = inject(ActivatedRoute);
  messageService = inject(MessageService);

  formulario = this.fb.group({
    id: ['', Validators.required],
    nombre: ['', Validators.required],
    alias: ['', Validators.required],
  });

  constructor() {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (!id) return;
      this.api.getOne(id).subscribe(item => this.formulario.patchValue(item));
    });
  }

  guardar() {
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }
    const { id, nombre, alias } = this.formulario.getRawValue();
    this.api.update({ nombre: nombre!, alias: alias! }, id!).subscribe(() => {
      this.messageService.add({ severity: 'success', summary: 'Actualización exitosa', detail: 'Se actualizó el tipo de equipo.' });
      this.router.navigate(['../../'], { relativeTo: this.route });
    });
  }
}
