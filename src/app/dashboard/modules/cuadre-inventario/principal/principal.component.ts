import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, ViewChild, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { TagModule } from 'primeng/tag';
import { AppPrimengModule } from '@shared/app-primeng/app-primeng.module';
import { BotonRegresarComponent } from '@shared/components/boton-regresar/boton-regresar.component';
import { HeaderComponent } from '@shared/components/header/header.component';
import { DatetimePipe } from '@shared/pipes/datetime.pipe';
import {
  CatalogTableState,
  FilterOption,
  NativeColumn,
  NativeTableComponent,
  NATIVE_TABLE_IMPORTS,
} from '@shared/ui/native-table';
import { MessageService } from 'primeng/api';
import { AlmacenApiService } from '../../almacen/services/almacen.api.service';
import { CuadreInventarioApiService } from '../services/cuadre-inventario.api.service';
import { CuadreResumen } from '../services/cuadre-inventario.model';

interface Opcion<T> {
  label: string;
  value: T;
}

const ESTADOS: FilterOption[] = [
  { value: 'ABIERTO', label: 'Abierto' },
  { value: 'CERRADO', label: 'Cerrado' },
];

/** El back filtra ajusteAplicado=true|false (solo cuadres cerrados, igual que la columna). */
const AJUSTE: FilterOption[] = [
  { value: 'true', label: 'Sí' },
  { value: 'false', label: 'No' },
];

@Component({
  selector: 'app-cuadre-inventario-principal',
  imports: [
    CommonModule,
    FormsModule,
    AppPrimengModule,
    TagModule,
    BotonRegresarComponent,
    HeaderComponent,
    DatetimePipe,
    ...NATIVE_TABLE_IMPORTS,
  ],
  templateUrl: './principal.component.html',
  styleUrl: './principal.component.scss',
})
export class PrincipalComponent implements OnInit, OnDestroy {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly messageService = inject(MessageService);
  private readonly almacenApiService = inject(AlmacenApiService);
  readonly cuadreApiService = inject(CuadreInventarioApiService);
  @ViewChild(NativeTableComponent)
  set nativeTable(table: NativeTableComponent | undefined) {
    this.page.table = table;
  }

  /** Solo almacenes activos para crear un cuadre nuevo. */
  readonly almacenesActivos = computed<Opcion<string>[]>(() =>
    this.almacenApiService
      .listAll()
      .filter((row) => row.status !== false)
      .map((row) => ({ label: row.nombre, value: row.id }))
  );

  /**
   * Columnas; el filtro de Almacén se llena con todos los almacenes al cargarlos. El valor de cada opción
   * es el id del almacén (el back acepta id o nombre "contiene").
   */
  columns: NativeColumn<CuadreResumen>[] = this.buildColumns([]);

  /** Paginación, filtros (incluidos los de columna), búsqueda y orden en el servidor (GET cuadre-inventario/page). */
  readonly page = new CatalogTableState<CuadreResumen>((query) => this.cuadreApiService.getPage(query));

  // ---- Nuevo cuadre ----
  displayNuevo = false;
  almacenNuevo: string | null = null;
  creando = signal(false);

  // ---- Cancelar cuadre ----
  displayCancelar = false;
  cuadreACancelar: CuadreResumen | null = null;
  cancelando = signal(false);

  ngOnInit(): void {
    this.almacenApiService.getAll().subscribe((almacenes) => {
      const porId = new Map<string, string>();
      for (const row of almacenes ?? []) {
        if (row?.id && row.nombre && !porId.has(row.id)) porId.set(row.id, row.nombre);
      }
      const opciones = [...porId.entries()]
        .map(([value, label]) => ({ value, label }))
        .sort((a, b) => a.label.localeCompare(b.label, 'es', { numeric: true, sensitivity: 'base' }));
      this.columns = this.buildColumns(opciones);
    });
    this.page.resetAndLoad();
  }

  ngOnDestroy(): void {
    this.page.destroy();
  }

  cargar(): void {
    this.page.resetAndLoad();
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

  private buildColumns(almacenes: FilterOption[]): NativeColumn<CuadreResumen>[] {
    return [
      { id: 'folio', label: 'Folio', field: 'folio', width: 130, filter: { type: 'text' }, align: 'center' },
      { id: 'almacen', label: 'Almacén', width: 200, filter: { type: 'select', options: almacenes }, align: 'center' },
      { id: 'estado', label: 'Estado', width: 120, filter: { type: 'select', options: ESTADOS }, align: 'center' },
      { id: 'creadoPor', label: 'Creado por', field: 'creadoPor', width: 180, filter: { type: 'text' }, align: 'center' },
      { id: 'fechaCreacion', label: 'Fecha', width: 170, filter: { type: 'date' }, align: 'center' },
      { id: 'cerradoPor', label: 'Cerrado por', field: 'cerradoPor', width: 180, filter: { type: 'text' }, align: 'center' },
      { id: 'fechaCierre', label: 'Fecha de cierre', width: 170, filter: { type: 'date' }, align: 'center' },
      { id: 'ajuste', label: 'Ajuste aplicado', width: 140, filter: { type: 'select', options: AJUSTE }, align: 'center' },
      { id: 'partidasConDiferencia', label: 'Partidas con diferencia', width: 180, filter: { type: 'number' }, align: 'center' },
      { id: 'acciones', label: 'Acciones', width: 120, minWidth: 112, sortable: false, tooltip: false, align: 'center' },
    ];
  }
}
