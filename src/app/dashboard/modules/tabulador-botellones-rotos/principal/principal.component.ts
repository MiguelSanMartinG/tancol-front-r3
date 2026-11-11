import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { MessageService } from 'primeng/api';
import { finalize } from 'rxjs';
import { AppPrimengModule } from '@shared/app-primeng/app-primeng.module';
import { BotonRegresarComponent } from '@shared/components/boton-regresar/boton-regresar.component';
import { HeaderComponent } from '@shared/components/header/header.component';
import { EmpleadoApiService } from '../../empleados/services/empleado.api.service';
import { getEmpleadoNombreCompleto } from '../../empleados/services/dtos/empleado.response';
import { NuestrosProductosResponse } from '../../nuestros-productos/service/nuestros-productos.response';
import { NuestrosProductosService } from '../../nuestros-productos/service/nuestros-productos.service';
import { TabuladorBotellonesRotos, TabuladorBotellonesRotosRequest } from '../services/tabulador-botellones-rotos.model';
import { TabuladorBotellonesRotosApiService } from '../services/tabulador-botellones-rotos.api.service';

@Component({
  selector: 'app-tabulador-botellones-rotos',
  imports: [CommonModule, FormsModule, AppPrimengModule, BotonRegresarComponent, HeaderComponent],
  templateUrl: './principal.component.html',
})
export class PrincipalComponent implements OnInit {
  private api = inject(TabuladorBotellonesRotosApiService);
  private empleadosApi = inject(EmpleadoApiService);
  private productosApi = inject(NuestrosProductosService);
  private route = inject(ActivatedRoute);
  private messages = inject(MessageService);

  readonly empleadoId = this.route.snapshot.paramMap.get('idEmpleado') ?? '';
  filas = signal<TabuladorBotellonesRotos[]>([]);
  productos = signal<NuestrosProductosResponse[]>([]);
  empleadoNombre = signal('');
  editando = signal<TabuladorBotellonesRotos | null>(null);
  productoId = '';
  tolerancia: number | null = null;
  guardando = signal(false);
  confirmacionVisible = false;
  confirmacionTipo: 'guardar' | 'eliminar' = 'guardar';
  filaPendiente: TabuladorBotellonesRotos | null = null;

  get puedeGuardar(): boolean {
    return !!this.empleadoId && !!this.productoId && this.tolerancia !== null &&
      Number.isInteger(this.tolerancia) && this.tolerancia > 0 &&
      !this.filas().some((fila) => fila.productoId === this.productoId && fila.id !== this.editando()?.id);
  }

  ngOnInit() {
    this.cargar();
    this.empleadosApi.getAll().subscribe((items) => {
      const empleado = items.find((item) => item.idEmpleado === this.empleadoId);
      if (empleado) this.empleadoNombre.set(getEmpleadoNombreCompleto(empleado));
    });
    this.productosApi.getAll().subscribe((items) => this.productos.set(items.filter((item) => item.enabled)));
  }

  cargar() {
    this.api.listar({ idEmpleado: this.empleadoId }).subscribe((items) =>
      this.filas.set(items.filter((item) => item.empleadoId === this.empleadoId)),
    );
  }

  editar(fila: TabuladorBotellonesRotos) {
    this.api.consultar(fila.id).subscribe((actual) => {
      this.editando.set(actual);
      this.productoId = actual.productoId;
      this.tolerancia = actual.tolerancia;
    });
  }

  guardar() {
    if (!this.puedeGuardar) {
      this.messages.add({ key: 'center', severity: 'warn', summary: 'Datos inválidos', detail: 'Selecciona un producto y captura una tolerancia entera mayor que cero. Cada producto puede configurarse una sola vez por empleado.' });
      return;
    }
    this.confirmacionTipo = 'guardar';
    this.confirmacionVisible = true;
  }

  eliminar(fila: TabuladorBotellonesRotos) {
    this.filaPendiente = fila;
    this.confirmacionTipo = 'eliminar';
    this.confirmacionVisible = true;
  }

  confirmarAccion() {
    this.confirmacionVisible = false;
    if (this.confirmacionTipo === 'eliminar') {
      if (!this.filaPendiente) return;
      this.api.eliminar(this.filaPendiente.id).subscribe({
        next: () => {
          this.filaPendiente = null;
          this.cargar();
          this.messages.add({ key: 'top-right', severity: 'success', summary: 'Listo', detail: 'Configuración eliminada.' });
        },
        error: (error) => this.messages.add({ key: 'center', severity: 'error', summary: 'No se pudo eliminar', detail: this.errorMessage(error) }),
      });
      return;
    }

    const producto = this.productos().find((item) => item.idProductoComercial === this.productoId);
    const unidadMedidaId = producto?.unidadMedidaDefault?.idUnidadDeMedida;
    if (!unidadMedidaId || this.tolerancia === null) return;
    const body: TabuladorBotellonesRotosRequest = {
      idEmpleado: this.empleadoId,
      periodo: 'SEMANAL',
      tolerancia: this.tolerancia,
      idProducto: this.productoId,
      idUnidadMedida: unidadMedidaId,
    };
    const actual = this.editando();
    const call = actual ? this.api.actualizar(actual.id, body) : this.api.crear(body);
    this.guardando.set(true);
    call.pipe(finalize(() => this.guardando.set(false))).subscribe({
      next: () => {
        this.limpiar();
        this.cargar();
        this.messages.add({ key: 'top-right', severity: 'success', summary: 'Listo', detail: 'Configuración guardada.' });
      },
      error: (error) => this.messages.add({ key: 'center', severity: error?.status === 409 ? 'warn' : 'error', summary: 'No se pudo guardar', detail: this.errorMessage(error) }),
    });
  }

  productosDisponibles(): NuestrosProductosResponse[] {
    const seleccionados = new Set(this.filas().filter((fila) => fila.id !== this.editando()?.id).map((fila) => fila.productoId));
    return this.productos().filter((producto) => !seleccionados.has(producto.idProductoComercial));
  }

  unidadProductoSeleccionado(): string {
    return this.productos().find((producto) => producto.idProductoComercial === this.productoId)?.unidadMedidaDefault?.nombre ?? '';
  }

  mensajeConfirmacion(): string {
    return this.confirmacionTipo === 'eliminar'
      ? '¿Deseas eliminar esta configuración de tolerancia?'
      : `¿Deseas ${this.editando() ? 'actualizar' : 'guardar'} esta configuración de tolerancia?`;
  }

  private errorMessage(error: any) {
    const body = error?.error;
    if (typeof body === 'string' && body.trim()) return body;
    return body?.message || Object.values(body || {}).find((value) => typeof value === 'string') || 'Ocurrió un error al comunicarse con el servidor.';
  }

  limpiar() {
    this.editando.set(null);
    this.productoId = '';
    this.tolerancia = null;
  }
}
