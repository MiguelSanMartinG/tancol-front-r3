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
import { HttpClient, HttpContext } from '@angular/common/http';
import { SKIP_LOADING } from '@core/auth.interceptor';
import { CuadreResumen, TIPOS_CUADRE, TipoCuadre, etiquetaTipoCuadre } from '../services/cuadre-inventario.model';

interface Opcion<T> {
  label: string;
  value: T;
}

/** Almacén en «Nuevo cuadre», con cuántos insumos tiene (null mientras cuenta). */
interface OpcionAlmacen extends Opcion<string> {
  total: number | null;
  vacio: boolean;
}

/** Categoría con insumos en el almacén elegido. */
interface OpcionCategoria extends Opcion<string> {
  total: number;
}

/** Renglón de `GET inventario` (Inventario inicial): solo lo que se usa para contar. */
interface RegistroInventario {
  almacen?: { idAlmacen?: string } | null;
  producto?: {
    idProducto?: string;
    categoria?: { idCategoria?: string; nombre?: string; nombreCategoriaPadre?: string | null } | null;
  } | null;
}

/** Insumos por almacén y, dentro de cada almacén, por categoría. */
interface Conteo {
  porAlmacen: Map<string, Set<string>>;
  porCategoria: Map<string, Map<string, { nombre: string; productos: Set<string> }>>;
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

  readonly tiposCuadre = TIPOS_CUADRE;
  readonly etiquetaTipo = etiquetaTipoCuadre;
  @ViewChild(NativeTableComponent)
  set nativeTable(table: NativeTableComponent | undefined) {
    this.page.table = table;
  }

  private readonly http = inject(HttpClient);

  /** Conteo de insumos (null mientras carga). Si el backend manda `totalInsumos` en almacén, se usa ese. */
  private readonly conteo = signal<Conteo | null>(null);
  readonly contando = signal(false);
  /** Cuadres abiertos por almacén, para avisar antes de crear otro. */
  private readonly abiertos = signal<Map<string, CuadreResumen>>(new Map());

  /** Solo almacenes activos para crear un cuadre nuevo, con su total de insumos; los vacíos no se eligen. */
  readonly almacenesActivos = computed<OpcionAlmacen[]>(() => {
    const conteo = this.conteo();
    return this.almacenApiService
      .listAll()
      .filter((row) => row.status !== false)
      .map((row) => {
        const delBack = (row as { totalInsumos?: number }).totalInsumos;
        const total = delBack ?? (conteo ? conteo.porAlmacen.get(row.id)?.size ?? 0 : null);
        return { label: row.nombre, value: row.id, total, vacio: total === 0 };
      });
  });

  readonly almacenElegido = signal<string | null>(null);
  readonly categoriasElegidas = signal<string[]>([]);

  /** Categorías con insumos en el almacén elegido, con su total. */
  readonly categorias = computed<OpcionCategoria[]>(() => {
    const almacen = this.almacenElegido();
    const cats = almacen ? this.conteo()?.porCategoria.get(almacen) : undefined;
    if (!cats) return [];
    return [...cats.entries()]
      .map(([value, c]) => ({ value, label: c.nombre, total: c.productos.size }))
      .sort((a, b) => a.label.localeCompare(b.label, 'es', { sensitivity: 'base' }));
  });

  /** Lo que se va a contar con lo elegido. */
  readonly resumenNuevo = computed(() => {
    const almacen = this.almacenActivos(this.almacenElegido());
    if (!almacen || almacen.total === null) return null;
    const elegidas = this.categorias().filter((c) => this.categoriasElegidas().includes(c.value));
    if (!elegidas.length) return { total: almacen.total, detalle: 'todo el almacén' };
    return { total: elegidas.reduce((n, c) => n + c.total, 0), detalle: elegidas.map((c) => `${c.label} ${c.total}`).join(' + ') };
  });

  /** Cuadre abierto del almacén elegido. */
  readonly abiertoDelAlmacen = computed(() => {
    const id = this.almacenElegido();
    return id ? this.abiertos().get(id) ?? null : null;
  });

  private almacenActivos(id: string | null) {
    return id ? this.almacenesActivos().find((a) => a.value === id) ?? null : null;
  }

  /**
   * Columnas; el filtro de Almacén se llena con todos los almacenes al cargarlos. El valor de cada opción
   * es el id del almacén (el back acepta id o nombre "contiene").
   */
  columns: NativeColumn<CuadreResumen>[] = this.buildColumns([]);

  /** Paginación, filtros (incluidos los de columna), búsqueda y orden en el servidor (GET cuadre-inventario/page). */
  readonly page = new CatalogTableState<CuadreResumen>((query) => this.cuadreApiService.getPage(query));

  // ---- Nuevo cuadre ----
  displayNuevo = false;
  tipoNuevo: TipoCuadre | null = null;
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

  /** «Todo el almacén» o los nombres de las categorías contadas. */
  alcanceTexto(item: CuadreResumen): string {
    const cs = item.categorias ?? [];
    return cs.length ? cs.map((c) => c.nombre).join(', ') : 'Todo el almacén';
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
    this.almacenElegido.set(null);
    this.tipoNuevo = null;
    this.categoriasElegidas.set([]);
    this.displayNuevo = true;
    this.cargarConteo();
    this.cuadreApiService.getAll({ estado: 'ABIERTO' }).subscribe({
      next: (lista) => this.abiertos.set(new Map((lista ?? []).map((c) => [c.almacen?.id, c]).filter((e): e is [string, CuadreResumen] => !!e[0]))),
      error: () => this.abiertos.set(new Map()),
    });
  }

  elegirAlmacen(id: string | null) {
    this.almacenElegido.set(id);
    // Cada almacén tiene sus propias categorías.
    this.categoriasElegidas.set([]);
  }

  /** Cuenta los insumos con el Inventario inicial (una consulta, se reutiliza mientras no se recargue la página). */
  private cargarConteo() {
    if (this.conteo() || this.contando()) return;
    this.contando.set(true);
    this.http.get<RegistroInventario[]>('inventario', { context: new HttpContext().set(SKIP_LOADING, true) }).subscribe({
      next: (filas) => {
        const porAlmacen = new Map<string, Set<string>>();
        const porCategoria = new Map<string, Map<string, { nombre: string; productos: Set<string> }>>();
        for (const f of filas ?? []) {
          const almacen = f.almacen?.idAlmacen;
          const producto = f.producto?.idProducto;
          if (!almacen || !producto) continue;
          (porAlmacen.get(almacen) ?? porAlmacen.set(almacen, new Set()).get(almacen)!).add(producto);
          const cat = f.producto?.categoria;
          const idCat = cat?.idCategoria ?? 'sin-categoria';
          const nombre = cat?.idCategoria ? (cat.nombreCategoriaPadre ? `${cat.nombreCategoriaPadre} › ${cat.nombre}` : cat.nombre ?? '') : 'Sin categoría';
          const cats = porCategoria.get(almacen) ?? porCategoria.set(almacen, new Map()).get(almacen)!;
          (cats.get(idCat) ?? cats.set(idCat, { nombre, productos: new Set() }).get(idCat)!).productos.add(producto);
        }
        this.conteo.set({ porAlmacen, porCategoria });
        this.contando.set(false);
      },
      error: () => this.contando.set(false),
    });
  }

  irAlAbierto() {
    const c = this.abiertoDelAlmacen();
    if (!c) return;
    this.displayNuevo = false;
    this.abrir(c);
  }

  crear(): void {
    const idAlmacen = this.almacenElegido();
    const tipo = this.tipoNuevo;
    if (!idAlmacen || !tipo || this.creando() || this.abiertoDelAlmacen()) return;
    this.creando.set(true);
    this.cuadreApiService.create({ idAlmacen, tipo, idsCategoria: this.categoriasElegidas().filter((c) => c !== 'sin-categoria') }).subscribe({
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
      { id: 'folio', label: 'Folio', field: 'folio', width: 130, filter: { type: 'text' }, align: 'left' },
      { id: 'tipo', label: 'Tipo', width: 120, filter: { type: 'select', options: TIPOS_CUADRE }, align: 'left' },
      { id: 'almacen', label: 'Almacén', width: 200, filter: { type: 'select', options: almacenes }, align: 'left' },
      { id: 'categorias', label: 'Categorías', width: 220, sortable: false, align: 'left' },
      { id: 'estado', label: 'Estado', width: 120, filter: { type: 'select', options: ESTADOS }, align: 'left' },
      { id: 'creadoPor', label: 'Creado por', field: 'creadoPor', width: 180, filter: { type: 'text' }, align: 'left' },
      { id: 'fechaCreacion', label: 'Fecha', width: 170, filter: { type: 'date' }, align: 'left' },
      { id: 'cerradoPor', label: 'Cerrado por', field: 'cerradoPor', width: 180, filter: { type: 'text' }, align: 'left' },
      { id: 'fechaCierre', label: 'Fecha de cierre', width: 170, filter: { type: 'date' }, align: 'left' },
      { id: 'ajuste', label: 'Ajuste', width: 110, filter: { type: 'select', options: AJUSTE }, align: 'left' },
      { id: 'partidasConDiferencia', label: 'Diferencia', width: 120, filter: { type: 'number' }, align: 'left' },
      { id: 'acciones', label: 'Acciones', width: 120, minWidth: 112, sortable: false, tooltip: false, align: 'left' },
    ];
  }
}
