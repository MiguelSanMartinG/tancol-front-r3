import { RequiredMarkerDirective } from '@shared/directive/required-marker.directive';
import { Component, computed, EventEmitter, inject, Output } from '@angular/core';
import { EmpleadoApiService } from '../../empleados/services/empleado.api.service';
import { getEmpleadoNombreCompleto } from '../../empleados/services/dtos/empleado.response';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AppPrimengModule } from '@shared/app-primeng/app-primeng.module';
import { MessageService } from 'primeng/api';
import { AlmacenApiService } from '../services/almacen.api.service';
import { MessageErrorComponent } from '../../../../shared/components/message-error/message-error.component';
import { NgTemplateOutlet } from '@angular/common';
import { alreadyTaken } from '@core/common/already-taken.validator';

@Component({
  selector: 'app-registrar-almacen',
  imports: [RequiredMarkerDirective, AppPrimengModule, ReactiveFormsModule, MessageErrorComponent,  NgTemplateOutlet],
  templateUrl: './registrar.component.html',
  styleUrl: './registrar.component.scss',
})
export class RegistrarAlmacenComponent {
  @Output() saved = new EventEmitter<void>();
  display = false;
  almacenApiService = inject(AlmacenApiService);
  fb = inject(FormBuilder);
  formulario = this.fb.group({
    nombre: ['', [Validators.required],[alreadyTaken(this.almacenApiService,'?nombre=')]],
    idResponsable: [null as string | null],
  });
  private readonly empleadoApi = inject(EmpleadoApiService);
  /** Empleados activos. */
  readonly responsables = computed(() =>
    this.empleadoApi.listAll()
      .filter((e) => e.enabled)
      .map((e) => ({ label: getEmpleadoNombreCompleto(e), value: e.idEmpleado })),
  );
  messageService = inject(MessageService);
  submit() {
    if (!this.formulario.valid) {
      this.formulario.markAllAsTouched();
      this.messageService.add({
        key: 'center',
        severity: 'warn',
        summary: '¡Precaución!',
        detail: 'Hay campos inválidos o faltan campos por llenar.',
      });
      return;
    }

    this.almacenApiService
      .create({
        nombre: this.formulario.getRawValue().nombre!,
        idResponsable: this.formulario.getRawValue().idResponsable,
      })
      .subscribe((resp) => {
        this.display = false;
        this.saved.emit();
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
