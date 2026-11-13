import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { InputNumberModule } from 'primeng/inputnumber';
import { ActivatedRoute } from '@angular/router';
import { AppPrimengModule } from '@shared/app-primeng/app-primeng.module';
import { BotonRegresarComponent } from '@shared/components/boton-regresar/boton-regresar.component';
import { HeaderComponent } from '@shared/components/header/header.component';
import { NuestrosProductosResponse } from '../../nuestros-productos/service/nuestros-productos.response';
import { NuestrosProductosService } from '../../nuestros-productos/service/nuestros-productos.service';
import { RutasApiService } from '../../rutas/services/rutas-api.service';
import { RutasResponse } from '../../rutas/services/rutas.response';
import { MetaVentaRuta, MetaVentaRutaRequest } from '../services/meta-venta-ruta.model';
import { MetaVentaRutaApiService } from '../services/meta-venta-ruta.api.service';

interface RutaOption {
  id: string;
  etiqueta: string;
}

@Component({
  selector: 'app-metas-ruta',
  imports: [CommonModule, FormsModule, InputNumberModule, AppPrimengModule, BotonRegresarComponent, HeaderComponent],
  templateUrl: './metas-ruta.component.html',
})
export class MetasRutaComponent implements OnInit {
  private api = inject(MetaVentaRutaApiService);
  private rutasApi = inject(RutasApiService);
  private productosApi = inject(NuestrosProductosService);
  private messages = inject(MessageService);
  private route = inject(ActivatedRoute);

  metas = signal<MetaVentaRuta[]>([]);
  rutas = signal<RutaOption[]>([]);
  productos = signal<NuestrosProductosResponse[]>([]);
  editando = signal<MetaVentaRuta | null>(null);
  rutaId = '';
  productoId = '';
  cantidadMinima: number | null = null;
  readonly rutaFijaId = this.route.snapshot.paramMap.get('idRuta') ?? '';

  ngOnInit() {
    this.rutaId = this.rutaFijaId;
    this.cargar();
    this.rutasApi.getAll().subscribe((items: RutasResponse[]) => this.rutas.set(
      items
        .filter((item) => this.rutaFijaId ? item.id === this.rutaFijaId : item.enabled)
        .map((item) => ({ id: item.id, etiqueta: this.etiquetaRuta(item.numero, item.nombre) ?? item.id })),
    ));
    this.productosApi.getAll().subscribe((items) => this.productos.set(items.filter((item) => item.enabled)));
  }

  cargar() {
    this.api.listar().subscribe((items) => this.metas.set(
      this.rutaFijaId ? items.filter((meta) => meta.rutaId === this.rutaFijaId) : items,
    ));
  }

  guardar() {
    if (!this.rutaId || !this.productoId || this.cantidadMinima === null || !Number.isInteger(this.cantidadMinima) || this.cantidadMinima < 0) {
      this.messages.add({ severity: 'warn', summary: 'Datos incompletos', detail: 'Selecciona ruta, producto y captura una venta mínima entera válida.' });
      return;
    }
    const request: MetaVentaRutaRequest = { idRuta: this.rutaId, idProducto: this.productoId, cantidadMinima: this.cantidadMinima };
    const actual = this.editando();
    const call = actual
      ? this.api.actualizar(actual.id, request.cantidadMinima)
      : this.api.crear(request);
    call.subscribe({
      next: () => {
        this.limpiar();
        this.cargar();
        this.messages.add({ severity: 'success', summary: 'Listo', detail: 'Meta guardada.' });
      },
    });
  }

  editar(meta: MetaVentaRuta) {
    this.api.consultar(meta.id).subscribe((actual) => {
      if (!actual.activa) {
        this.cargar();
        this.messages.add({ severity: 'warn', summary: 'Meta cerrada', detail: 'La meta ya fue cerrada.' });
        return;
      }
      this.editando.set(actual);
      this.rutaId = actual.rutaId;
      this.productoId = actual.productoId;
      this.cantidadMinima = actual.cantidadMinima;
    });
  }

  cerrar(meta: MetaVentaRuta) {
    this.api.cerrar(meta.id).subscribe(() => {
      this.cargar();
      this.messages.add({ severity: 'success', summary: 'Listo', detail: 'Meta cerrada.' });
    });
  }

  limpiar() {
    this.editando.set(null);
    this.rutaId = this.rutaFijaId;
    this.productoId = '';
    this.cantidadMinima = null;
  }

  etiquetaRuta(numero: string | null | undefined, nombre: string | null | undefined): string | null {
    const num = numero?.trim() ?? '';
    const nom = nombre?.trim() ?? '';
    if (num && nom) return `${num} - ${nom}`;
    return nom || num || null;
  }

  etiquetaMetaRuta(meta: MetaVentaRuta): string {
    return this.etiquetaRuta(meta.rutaNumero, meta.rutaNombre) ?? meta.rutaId;
  }

  rutaSeleccionada(): string {
    return this.rutas().find((item) => item.id === this.rutaId)?.etiqueta ?? this.rutaId;
  }

  productosDisponibles(): NuestrosProductosResponse[] {
    const productosSeleccionados = new Set(this.metas()
      .filter((meta) => meta.activa && meta.rutaId === this.rutaId && meta.id !== this.editando()?.id)
      .map((meta) => meta.productoId));
    return this.productos().filter((producto) => !productosSeleccionados.has(producto.idProductoComercial));
  }

  unidadProductoSeleccionado(): string {
    return this.productos().find((producto) => producto.idProductoComercial === this.productoId)?.unidadMedidaDefault?.nombre ?? '';
  }
}
