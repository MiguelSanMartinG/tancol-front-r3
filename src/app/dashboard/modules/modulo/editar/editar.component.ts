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
  selector: 'app-modulo-editar',
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
export class EditarModuloComponent implements OnInit {
  moduloApiService = inject(ModuloApiService);
  fb = inject(FormBuilder);
  router = inject(Router);
  route = inject(ActivatedRoute);
  messageService = inject(MessageService);

  formulario = this.fb.group({
    name: ['', Validators.required],
    rutaModulo: ['', Validators.required],
    parentId: [''],
    id: [''],
  });

  modulosDisponibles: any[] = [];

  ngOnInit(): void {
    this.route.paramMap.subscribe((p) => {
      const id = p.get('id');
      if (id) {
        this.cargarDatos(id);
      }
    });
    this.moduloApiService.getAll().subscribe((resp) => {
      this.modulosDisponibles = resp;
    });
  }

  cargarDatos(id: string) {
    this.moduloApiService.getOne(id).subscribe((resp) => {
      this.formulario.patchValue({
        name: resp.name,
        rutaModulo: resp.ruta,
        parentId: resp.parent ? resp.parent?.idModulo : '',
        id: id,
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

    const formValue:any = this.formulario.getRawValue();
    console.log('formValue',formValue);
    let request:ModuloCreateDto = {
      name: formValue.name!,
      rutaModulo: formValue.rutaModulo!,
      parentId: (formValue.parentId)? <any>formValue.parentId: ''
    }
    this.moduloApiService.update(request, formValue.id!).subscribe(() => {
      this.formulario.reset();
      this.messageService.clear();
      this.router.navigate(['../../'], { relativeTo: this.route });
      this.messageService.add({
        key: 'top-right',
        severity: 'success',
        summary: '¡Actualización exitosa!',
        detail: 'Se ha actualizado el módulo',
      });
    });
  }

  handleHide() {
    this.formulario.reset();
  }
}
