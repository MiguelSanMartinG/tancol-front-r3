import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AsignacionPermisoAvanzado, PermisoAvanzado, PermisosAvanzadosService } from '@app/core/services/permisos-avanzados.service';
import { AppPrimengModule } from '@shared/app-primeng/app-primeng.module';
import { BotonRegresarComponent } from '@shared/components/boton-regresar/boton-regresar.component';
import { HeaderComponent } from '@shared/components/header/header.component';
import { MessageService } from 'primeng/api';
import { EmpleadoApiService } from '../../empleados/services/empleado.api.service';

@Component({
  selector: 'app-permisos-avanzados',
  imports: [CommonModule, ReactiveFormsModule, AppPrimengModule, BotonRegresarComponent, HeaderComponent],
  templateUrl: './principal.component.html',
})
export class PrincipalComponent implements OnInit {
  private fb = inject(FormBuilder);
  private permisosService = inject(PermisosAvanzadosService);
  private empleadosService = inject(EmpleadoApiService);
  private messageService = inject(MessageService);

  catalogo: PermisoAvanzado[] = [];
  asignaciones: AsignacionPermisoAvanzado[] = [];
  empleados: any[] = [];
  formulario = this.fb.group({ empleadoId: ['', Validators.required], codigo: ['', Validators.required] });

  ngOnInit() {
    this.permisosService.listarCatalogo().subscribe((items) => this.catalogo = items);
    this.empleadosService.getAllFilter('?enabled=true').subscribe((items) => this.empleados = items);
    this.cargarAsignaciones();
  }

  cargarAsignaciones() {
    this.permisosService.listarAsignaciones().subscribe((items) => this.asignaciones = items);
  }

  asignar() {
    if (this.formulario.invalid) { this.formulario.markAllAsTouched(); return; }
    const { empleadoId, codigo } = this.formulario.getRawValue();
    this.permisosService.asignar(empleadoId!, codigo!).subscribe(() => {
      this.messageService.add({ severity: 'success', summary: 'Permiso asignado' });
      this.formulario.reset({ empleadoId: '', codigo: '' });
      this.cargarAsignaciones();
    });
  }

  quitar(asignacion: AsignacionPermisoAvanzado) {
    this.permisosService.quitar(asignacion.id).subscribe(() => {
      this.messageService.add({ severity: 'success', summary: 'Permiso retirado' });
      this.cargarAsignaciones();
    });
  }

  nombreEmpleado(empleado: any) {
    return [empleado.nombre, empleado.apellidoPaterno, empleado.apellidoMaterno].filter(Boolean).join(' ');
  }
}
