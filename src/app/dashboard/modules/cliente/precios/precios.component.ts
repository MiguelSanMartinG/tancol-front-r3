import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AppPrimengModule } from '@shared/app-primeng/app-primeng.module';
import { HeaderComponent } from '@shared/components/header/header.component';
import { ClienteApiService } from '../services/cliente.service';
import { ClienteResponse } from '../services/cliente.response';
import { NuestrosProductosService } from '../../nuestros-productos/service/nuestros-productos.service';
import { RutasApiService } from '../../rutas/services/rutas-api.service';
import { TipoClienteApiService } from '../../tipo-cliente/services/tipo-cliente.api.service';
import { MessageService } from 'primeng/api';
import { forkJoin, switchMap } from 'rxjs';
import { PrecioClienteDTO, PrecioClienteProductoService } from '../services/precio-cliente-producto.service';

interface SelectOption {
  label: string;
  value: string;
  precio?: number;
}

@Component({
  selector: 'app-precios',
  standalone: true,
  templateUrl: './precios.component.html',
  imports: [CommonModule, FormsModule, AppPrimengModule, HeaderComponent],
  styleUrl: './precios.component.scss',
})
export class PreciosComponent {
  private clientesApi = inject(ClienteApiService);
  private productosApi = inject(NuestrosProductosService);
  private rutasApi = inject(RutasApiService);
  private tiposClienteApi = inject(TipoClienteApiService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private precioService = inject(PrecioClienteProductoService);
  private messageService = inject(MessageService);

  clientes = signal<ClienteResponse[]>([]);
  clientesSeleccionados = signal<string[]>([]);
  productosSeleccionados = signal<string[]>([]);
  rutasSeleccionadas = signal<string[]>([]);
  tiposClienteSeleccionados = signal<string[]>([]);
  preciosCliente = signal<Record<string, number>>({});
  guardando = signal(false);

  rutas: SelectOption[] = [];
  tiposCliente: SelectOption[] = [];
  productos = signal<SelectOption[]>([]);

  productosSeleccionadosLista = computed(() =>
    this.productos().filter(producto => this.productosSeleccionados().includes(producto.value))
  );

  clientesFiltrados = computed(() => this.clientes().filter(cliente => {
    const rutaIds = this.rutasSeleccionadas();
    const tipoIds = this.tiposClienteSeleccionados();
    const coincideRuta = !rutaIds.length || rutaIds.includes(cliente.rutaAsociada?.id);
    const tipoId = cliente.tipoDeCliente?.idTipoCliente;
    const coincideTipo = !tipoIds.length || tipoIds.includes(tipoId);
    return coincideRuta && coincideTipo;
  }).map(cliente => ({
    label: cliente.nombreComercial,
    value: cliente.id,
  })));

  constructor() {
    this.clientesApi.getAllFilter('?enabled=true').subscribe(resp => this.clientes.set(resp));
    this.productosApi.getAllFilter('?enabled=true').subscribe(resp => {
      this.productos.set(resp.map(producto => ({
        label: producto.nombre,
        value: producto.idProductoComercial,
        precio: producto.precio,
      })));
    });
    this.rutasApi.getAllFilter('?enabled=true').subscribe(resp => {
      this.rutas = resp.map(ruta => ({ label: ruta.nombre, value: ruta.id }));
    });
    this.tiposClienteApi.getAllFilter('?enabled=true').subscribe(resp => {
      this.tiposCliente = resp.map(tipo => ({
        label: tipo.nombre,
        value: tipo.idTiposClientes ?? tipo.idTipoCliente,
      }));
    });
  }

  actualizarClientesSeleccionados(values: (string | SelectOption)[]) {
    const ids = values.map(value => typeof value === 'string' ? value : value.value);
    const disponibles = new Set(this.clientesFiltrados().map(cliente => cliente.value));
    this.clientesSeleccionados.set(ids.filter(id => disponibles.has(id)));
  }

  actualizarProductosSeleccionados(values: (string | SelectOption)[]) {
    const ids = values.map(value => typeof value === 'string' ? value : value.value);
    const precios = { ...this.preciosCliente() };
    ids.forEach(id => precios[id] ??= 0);
    Object.keys(precios).filter(id => !ids.includes(id)).forEach(id => delete precios[id]);
    this.productosSeleccionados.set(ids);
    this.preciosCliente.set(precios);
  }

  eliminarProducto(id: string) {
    this.actualizarProductosSeleccionados(
      this.productosSeleccionados().filter(productoId => productoId !== id)
    );
  }

  actualizarPrecioCliente(id: string, precio: number) {
    this.preciosCliente.update(precios => ({ ...precios, [id]: Number(precio) || 0 }));
  }

  guardarAsignacion() {
    const clientes = this.clientesSeleccionados();
    const productos = this.productosSeleccionadosLista();

    if (!clientes.length || !productos.length) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Información incompleta',
        detail: 'Selecciona al menos un cliente y un producto.',
      });
      return;
    }

    this.guardando.set(true);
    forkJoin(clientes.map(idCliente =>
      this.precioService.getAllFilter(`?idCliente=${idCliente}`).pipe(
        switchMap(preciosActuales => {
          const actuales = new Map(
            preciosActuales.map(precio => [precio.producto?.idProductoComercial, precio.idPrecio])
          );
          const body: PrecioClienteDTO[] = productos.map(producto => ({
            descuento: this.preciosCliente()[producto.value] ?? 0,
            idPrecioCliente: actuales.get(producto.value) ?? null,
            idProducto: producto.value,
          }));
          return this.precioService.update(body, idCliente);
        })
      )
    )).subscribe({
      next: () => {
        this.guardando.set(false);
        this.messageService.add({
          severity: 'success',
          summary: 'Asignación guardada',
          detail: `Se actualizaron ${clientes.length} cliente(s).`,
        });
      },
      error: () => {
        this.guardando.set(false);
        this.messageService.add({
          severity: 'error',
          summary: 'Error al guardar',
          detail: 'No fue posible completar la asignación masiva.',
        });
      },
    });
  }

  goToClientes() {
    this.router.navigate(['../principal'], { relativeTo: this.route });
  }
}
