import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AppPrimengModule } from '@shared/app-primeng/app-primeng.module';
import { AppSharedModule } from '@shared/app-shared.module';
import { BotonRegresarComponent } from '@shared/components/boton-regresar/boton-regresar.component';
import { HeaderComponent } from '@shared/components/header/header.component';
import { MessageService } from 'primeng/api';
import { ClienteApiService } from '../services/cliente.service';
import { ClienteResponse } from '../services/cliente.response';
import { EquipoAsignacion, EquipoAsignacionService, EquipoDisponible } from '../services/equipo-asignacion.service';

@Component({
  selector: 'app-cliente-equipos',
  templateUrl: './equipos.component.html',
  styleUrl: './equipos.component.scss',
  imports: [CommonModule, AppPrimengModule, ReactiveFormsModule, AppSharedModule, BotonRegresarComponent, HeaderComponent],
})
export class EquiposComponent {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private fb = inject(FormBuilder);
  private clienteApi = inject(ClienteApiService);
  private asignacionApi = inject(EquipoAsignacionService);
  private messageService = inject(MessageService);

  cliente = signal<ClienteResponse | null>(null);
  equipos = signal<EquipoDisponible[]>([]);
  asignaciones = signal<EquipoAsignacion[]>([]);
  idCliente = '';

  formulario = this.fb.group({
    idEquipo: ['', Validators.required],
    montoMinimo: [0, [Validators.required, Validators.min(0)]],
  });

  ngOnInit() {
    this.idCliente = this.route.snapshot.paramMap.get('id') ?? '';
    if (!this.idCliente) return;
    this.clienteApi.getOne(this.idCliente).subscribe(response => this.cliente.set(response));
    this.cargar();
  }

  cargar() {
    this.asignacionApi.equiposDisponibles().subscribe(response => this.equipos.set(response));
    this.asignacionApi.asignaciones(this.idCliente).subscribe(response => this.asignaciones.set(response));
  }

  guardar() {
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }
    const { idEquipo, montoMinimo } = this.formulario.getRawValue();
    this.asignacionApi.asignar({ idEquipo: idEquipo!, idCliente: this.idCliente, montoMinimo: Number(montoMinimo) }).subscribe(() => {
      this.messageService.add({ severity: 'success', summary: 'Asignación exitosa', detail: 'El equipo fue asignado al cliente.' });
      this.formulario.reset({ idEquipo: '', montoMinimo: 0 });
      this.cargar();
    });
  }

  devolver(asignacion: EquipoAsignacion) {
    this.asignacionApi.devolver(asignacion.id).subscribe(() => {
      this.messageService.add({ severity: 'success', summary: 'Equipo devuelto', detail: 'El equipo quedó disponible nuevamente.' });
      this.cargar();
    });
  }

  regresar() { this.router.navigate(['../'], { relativeTo: this.route }); }
}
