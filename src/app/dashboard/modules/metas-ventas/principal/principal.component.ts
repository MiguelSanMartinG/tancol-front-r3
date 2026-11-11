import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { InputNumberModule } from 'primeng/inputnumber';
import { ActivatedRoute } from '@angular/router';
import { AppPrimengModule } from '@shared/app-primeng/app-primeng.module';
import { BotonRegresarComponent } from '@shared/components/boton-regresar/boton-regresar.component';
import { HeaderComponent } from '@shared/components/header/header.component';
import { EmpleadoApiService } from '../../empleados/services/empleado.api.service';
import { EmpleadoResponseDto, getEmpleadoNombreCompleto } from '../../empleados/services/dtos/empleado.response';
import { NuestrosProductosResponse } from '../../nuestros-productos/service/nuestros-productos.response';
import { NuestrosProductosService } from '../../nuestros-productos/service/nuestros-productos.service';
import { MetaVenta } from '../services/meta-venta.model';
import { MetaVentaApiService } from '../services/meta-venta.api.service';

@Component({
  selector: 'app-metas-ventas',
  imports: [CommonModule, FormsModule, InputNumberModule, AppPrimengModule, BotonRegresarComponent, HeaderComponent],
  templateUrl: './principal.component.html',
})
export class PrincipalComponent implements OnInit {
  private api = inject(MetaVentaApiService);
  private empleadosApi = inject(EmpleadoApiService);
  private productosApi = inject(NuestrosProductosService);
  private messages = inject(MessageService);
  private route = inject(ActivatedRoute);

  metas = signal<MetaVenta[]>([]);
  empleados = signal<EmpleadoResponseDto[]>([]);
  productos = signal<NuestrosProductosResponse[]>([]);
  editando = signal<MetaVenta | null>(null);
  empleadoId = '';
  productoId = '';
  cantidadMinima: number | null = null;
  readonly empleadoFijoId = this.route.snapshot.paramMap.get('idEmpleado') ?? '';

  ngOnInit() {
    this.empleadoId = this.empleadoFijoId;
    this.cargar();
    this.empleadosApi.getAll().subscribe((items) => this.empleados.set(
      items.filter((item) => this.empleadoFijoId ? item.idEmpleado === this.empleadoFijoId : item.enabled),
    ));
    this.productosApi.getAll().subscribe((items) => this.productos.set(items.filter((item) => item.enabled)));
  }

  cargar() {
    this.api.listar().subscribe((items) => this.metas.set(
      this.empleadoFijoId ? items.filter((meta) => meta.empleadoId === this.empleadoFijoId) : items,
    ));
  }

  guardar() {
    if (!this.empleadoId || !this.productoId || this.cantidadMinima === null || !Number.isInteger(this.cantidadMinima) || this.cantidadMinima < 0) {
      this.messages.add({ severity: 'warn', summary: 'Datos incompletos', detail: 'Selecciona empleado, producto y captura una venta mínima entera válida.' });
      return;
    }
    const request = { idEmpleado: this.empleadoId, idProducto: this.productoId, cantidadMinima: this.cantidadMinima };
    const call = this.editando()
      ? this.api.actualizar(this.editando()!.id, request.cantidadMinima)
      : this.api.crear(request);
    call.subscribe({
      next: () => {
        this.limpiar();
        this.cargar();
        this.messages.add({ severity: 'success', summary: 'Listo', detail: 'Meta guardada.' });
      },
    });
  }

  editar(meta: MetaVenta) {
    this.api.consultar(meta.id).subscribe((actual) => {
      if (!actual.activa) {
        this.cargar();
        this.messages.add({ severity: 'warn', summary: 'Meta cerrada', detail: 'La meta ya fue cerrada.' });
        return;
      }
      this.editando.set(actual);
      this.empleadoId = actual.empleadoId;
      this.productoId = actual.productoId;
      this.cantidadMinima = actual.cantidadMinima;
    });
  }

  cerrar(meta: MetaVenta) {
    this.api.cerrar(meta.id).subscribe(() => {
      this.cargar();
      this.messages.add({ severity: 'success', summary: 'Listo', detail: 'Meta cerrada.' });
    });
  }

  limpiar() {
    this.editando.set(null);
    this.empleadoId = this.empleadoFijoId;
    this.productoId = '';
    this.cantidadMinima = null;
  }

  nombreEmpleado(empleado: EmpleadoResponseDto) {
    return getEmpleadoNombreCompleto(empleado);
  }

  empleadoSeleccionado(): string {
    const empleado = this.empleados().find((item) => item.idEmpleado === this.empleadoId);
    return empleado ? this.nombreEmpleado(empleado) : this.empleadoId;
  }

  productosDisponibles(): NuestrosProductosResponse[] {
    const productosSeleccionados = new Set(this.metas()
      .filter((meta) => meta.activa && meta.empleadoId === this.empleadoId && meta.id !== this.editando()?.id)
      .map((meta) => meta.productoId));
    return this.productos().filter((producto) => !productosSeleccionados.has(producto.idProductoComercial));
  }

  unidadProductoSeleccionado(): string {
    return this.productos().find((producto) => producto.idProductoComercial === this.productoId)?.unidadMedidaDefault?.nombre ?? '';
  }
}
