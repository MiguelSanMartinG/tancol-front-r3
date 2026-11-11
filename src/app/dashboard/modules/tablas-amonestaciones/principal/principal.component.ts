import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { AppPrimengModule } from '@shared/app-primeng/app-primeng.module';
import { BotonRegresarComponent } from '@shared/components/boton-regresar/boton-regresar.component';
import { HeaderComponent } from '@shared/components/header/header.component';
import { ProductoAmonestacionDisponible, TablaAmonestacion, TablaAmonestacionRequest } from '../services/tabla-amonestacion.model';
import { TablaAmonestacionApiService } from '../services/tabla-amonestacion.api.service';
import { finalize } from 'rxjs';

@Component({
  selector: 'app-tablas-amonestaciones',
  imports: [CommonModule, FormsModule, AppPrimengModule, BotonRegresarComponent, HeaderComponent],
  templateUrl: './principal.component.html',
  styleUrl: './principal.component.scss',
})
export class PrincipalComponent implements OnInit {
  private api = inject(TablaAmonestacionApiService);
  private messages = inject(MessageService);
  filas = signal<TablaAmonestacion[]>([]);
  productos = signal<ProductoAmonestacionDisponible[]>([]);
  editando = signal<TablaAmonestacion | null>(null);
  productoId = '';
  cantidadDesde: number | null = null;
  cantidadHasta: number | null = null;
  descuento: number | null = null;
  guardando = signal(false);

  get puedeGuardar(): boolean {
    return !!this.productoId && this.cantidadDesde !== null && Number.isInteger(this.cantidadDesde) && this.cantidadDesde >= 1 &&
      this.cantidadHasta !== null && Number.isInteger(this.cantidadHasta) && this.cantidadHasta >= this.cantidadDesde &&
      this.descuento !== null && Number.isFinite(this.descuento) && this.descuento >= 0 && Number(this.descuento.toFixed(2)) === this.descuento;
  }

  ngOnInit() { this.cargar(); this.cargarProductos(); }
  cargar() {
    this.api.listar().subscribe({
      next: (items) => this.filas.set(items),
      error: () => this.messages.add({ key: 'center', severity: 'error', summary: 'No se pudieron cargar las tablas', detail: 'El servidor no respondió. Intenta recargar la pantalla.' }),
    });
  }
  cargarProductos(tablaId?: string) {
    this.api.productosDisponibles(tablaId).subscribe({
      next: (items) => this.productos.set(items),
      error: () => this.messages.add({ key: 'center', severity: 'error', summary: 'No se pudieron cargar los productos', detail: 'El servidor no respondió. Intenta recargar la pantalla.' }),
    });
  }
  editar(fila: TablaAmonestacion) {
    this.api.consultar(fila.id).subscribe((actual) => {
      this.editando.set(actual); this.productoId = actual.productoId; this.cantidadDesde = actual.cantidadDesde; this.cantidadHasta = actual.cantidadHasta; this.descuento = Math.abs(actual.descuento); this.cargarProductos(actual.id);
    });
  }
  formatoDescuento(value: number) {
    const monto = Math.abs(value).toFixed(2);
    return `-$${Number(monto) < 10 ? '0' : ''}${monto}`;
  }
  guardar() {
    if (!this.puedeGuardar || this.guardando()) {
      this.messages.add({ key: 'center', severity: 'warn', summary: 'Completa los datos', detail: 'Selecciona un producto, captura un rango entero válido y un descuento de hasta dos decimales.' }); return;
    }
    const body: TablaAmonestacionRequest = { cantidadDesde: this.cantidadDesde!, cantidadHasta: this.cantidadHasta!, idProducto: this.productoId, descuento: -Math.abs(this.descuento!) };
    const call = this.editando() ? this.api.actualizar(this.editando()!.id, body) : this.api.crear(body);
    this.guardando.set(true);
    call.pipe(finalize(() => this.guardando.set(false))).subscribe({
      next: () => { this.limpiar(); this.cargar(); this.cargarProductos(); this.messages.add({ key: 'top-right', severity: 'success', summary: 'Listo', detail: 'Tabla guardada.' }); },
      error: (error) => this.messages.add({ key: 'center', severity: error?.status === 409 ? 'warn' : 'error', summary: 'No se pudo guardar', detail: this.errorMessage(error) }),
    });
  }
  eliminar(fila: TablaAmonestacion) { this.api.eliminar(fila.id).subscribe(() => { this.cargar(); this.cargarProductos(); this.messages.add({ severity: 'success', summary: 'Listo', detail: 'Tabla eliminada.' }); }); }
  private errorMessage(error: any) {
    const body = error?.error;
    if (typeof body === 'string' && body.trim()) return body;
    return body?.message || Object.values(body || {}).find((value) => typeof value === 'string') || 'El servidor no respondió en 15 segundos o ocurrió un error al guardar.';
  }
  limpiar() { this.editando.set(null); this.productoId = ''; this.cantidadDesde = null; this.cantidadHasta = null; this.descuento = null; }
}
