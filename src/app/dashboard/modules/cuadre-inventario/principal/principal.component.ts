import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AppPrimengModule } from '@shared/app-primeng/app-primeng.module';
import { BotonRegresarComponent } from '@shared/components/boton-regresar/boton-regresar.component';
import { HeaderComponent } from '@shared/components/header/header.component';
import { DatetimePipe } from '@shared/pipes/datetime.pipe';
import { MessageService } from 'primeng/api';
import { AlmacenApiService } from '../../almacen/services/almacen.api.service';
import { CuadreInventarioApiService } from '../services/cuadre-inventario.api.service';
import { CuadreResumen, EstadoCuadre } from '../services/cuadre-inventario.model';

interface Opcion<T> {
  label: string;
  value: T;
}

@Component({
  selector: 'app-cuadre-inventario-principal',
  imports: [
    CommonModule,
    FormsModule,
    AppPrimengModule,
    BotonRegresarComponent,
    HeaderComponent,
    DatetimePipe,
  ],
  templateUrl: './principal.component.html',
})
export class PrincipalComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly messageService = inject(MessageService);
  private readonly almacenApiService = inject(AlmacenApiService);
  readonly cuadreApiService = inject(CuadreInventarioApiService);

  filtroAlmacen: string | null = null;
  filtroEstado: EstadoCuadre | null = null;

  readonly estados: Opcion<EstadoCuadre>[] = [
    { label: 'Abierto', value: 'ABIERTO' },
    { label: 'Cerrado', value: 'CERRADO' },
  ];

  /** Todos los almacenes (para filtrar cuadres históricos). */
  readonly almacenesFiltro = computed<Opcion<string>[]>(() =>
    this.almacenApiService.listAll().map((row) => ({ label: row.nombre, value: row.id }))
  );

  /** Solo almacenes activos para crear un cuadre nuevo. */
  readonly almacenesActivos = computed<Opcion<string>[]>(() =>
    this.almacenApiService
      .listAll()
      .filter((row) => row.status !== false)
      .map((row) => ({ label: row.nombre, value: row.id }))
  );

  readonly registros = computed(() => this.cuadreApiService.listAll());

  // ---- Nuevo cuadre ----
  displayNuevo = false;
  almacenNuevo: string | null = null;
  creando = signal(false);

  // ---- Cancelar cuadre ----
  displayCancelar = false;
  cuadreACancelar: CuadreResumen | null = null;
  cancelando = signal(false);

  ngOnInit(): void {
    this.almacenApiService.getAll().subscribe();
    this.cargar();
  }

  cargar(): void {
    this.cuadreApiService
      .getAll({ idAlmacen: this.filtroAlmacen, estado: this.filtroEstado })
      .subscribe();
  }

  limpiarFiltros(): void {
    this.filtroAlmacen = null;
    this.filtroEstado = null;
    this.cargar();
  }

  ajusteTexto(item: CuadreResumen): string {
    if (item.estado !== 'CERRADO') return '—';
    return item.ajusteAplicado ? 'Sí' : 'No';
  }

  abrir(item: CuadreResumen): void {
    this.router.navigate([item.id], { relativeTo: this.route });
  }

  // ---- Nuevo ----
  abrirNuevo(): void {
    this.almacenNuevo = null;
    this.displayNuevo = true;
  }

  crear(): void {
    const idAlmacen = this.almacenNuevo;
    if (!idAlmacen || this.creando()) return;
    this.creando.set(true);
    this.cuadreApiService.create({ idAlmacen }).subscribe({
      next: (resp) => {
        this.creando.set(false);
        this.displayNuevo = false;
        this.messageService.add({
          key: 'top-right',
          severity: 'success',
          summary: 'Cuadre creado',
          detail: `Se creó el cuadre ${resp.folio}.`,
        });
        this.router.navigate([resp.id], { relativeTo: this.route });
      },
      // El interceptor ya muestra el error (p. ej. 409 si ya hay un cuadre abierto).
      error: () => this.creando.set(false),
    });
  }

  // ---- Cancelar ----
  confirmarCancelar(item: CuadreResumen): void {
    this.cuadreACancelar = item;
    this.displayCancelar = true;
  }

  cancelar(): void {
    const item = this.cuadreACancelar;
    if (!item || this.cancelando()) return;
    this.cancelando.set(true);
    this.cuadreApiService.cancelar(item.id).subscribe({
      next: () => {
        this.cancelando.set(false);
        this.displayCancelar = false;
        this.cuadreACancelar = null;
        this.messageService.add({
          key: 'top-right',
          severity: 'success',
          summary: 'Cuadre cancelado',
          detail: `Se canceló el cuadre ${item.folio}.`,
        });
        this.cargar();
      },
      error: () => {
        this.cancelando.set(false);
        this.cargar();
      },
    });
  }
}
