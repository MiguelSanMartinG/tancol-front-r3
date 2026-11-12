import { Component, EventEmitter, Output, effect, inject, signal, untracked } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { AppPrimengModule } from '@shared/app-primeng/app-primeng.module';
import { MessageErrorComponent } from '@shared/components/message-error/message-error.component';
import { MessageService } from 'primeng/api';
import { NgTemplateOutlet } from '@angular/common';
import { StatusBinaryReadOnlyComponent } from '@shared/components/status-binary-read-only/status-binary-read-only.component';
import { EmpleadoResponseDto } from '../services/dtos/empleado.response';
import { EmpleadoApiService } from '../services/empleado.api.service';
import { switchMap } from 'rxjs';

@Component({
  selector: 'app-eliminar',
  imports: [
    AppPrimengModule,
    ReactiveFormsModule,
    MessageErrorComponent,
    NgTemplateOutlet,
    StatusBinaryReadOnlyComponent,
  ],
  templateUrl: './eliminar.component.html',
  styleUrl: './eliminar.component.scss',
})
export class EliminarComponent {
  @Output() deleted = new EventEmitter<void>();
  display = false;
  tipoEmpleadoApiService = inject(EmpleadoApiService);
  itemDto = signal<EmpleadoResponseDto | null>(null);
  fb = inject(FormBuilder);
  formulario = this.fb.group({
    nombre: [{ disabled: true, value: '' }, Validators.required],
    alias: [{ disabled: true, value: '' }, Validators.required],
  });
  messageService = inject(MessageService);

  constructor() {
    effect(() => {
      if (this.itemDto() !== null) {
        untracked(() => {
          this.formulario.patchValue({
            nombre: this.itemDto()!.nombre,
          });
        });
      }
    });
  }

  submit() {
    const empleadoId = this.itemDto()?.idEmpleado;
    if (!empleadoId) {
      return;
    }

    this.tipoEmpleadoApiService
      .getOne(empleadoId)
      .pipe(
        switchMap((empleado: any) =>
          this.tipoEmpleadoApiService.update(
            {
              apellidoMaterno: empleado.apellidoMaterno ?? '',
              apellidoPaterno: empleado.apellidoPaterno ?? '',
              correo: empleado.email ?? empleado.correo ?? '',
              enabled: false,
              fechaNacimiento: empleado.fechaNacimiento ?? '',
              idDepartamento: empleado.departamento?.idDepartamento ?? '',
              idRol: empleado.role?.id ?? 0,
              idTipoEmpleado: empleado.tipoEmpleado?.idTipoEmpleado ?? '',
              nombre: empleado.nombre ?? '',
              telefono: empleado.telefono ?? '',
            },
            empleadoId
          )
        )
      )
      .subscribe(() => {
        this.handleHide();
        this.deleted.emit();
        this.messageService.clear();
        this.messageService.add({
          key: 'top-right',
          severity: 'success',
          summary: 'Desactivación exitosa',
          detail: 'Se ha desactivado el empleado',
        });
      });
  }

  handleHide() {
    this.display = false;
    this.formulario.reset();
  }
}
