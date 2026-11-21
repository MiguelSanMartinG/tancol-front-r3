import { CommonModule } from '@angular/common';
import { Component, effect, inject, OnDestroy, OnInit, signal, untracked, ViewChild } from '@angular/core';
import { AppPrimengModule } from '@shared/app-primeng/app-primeng.module';
import { BotonRegresarComponent } from '@shared/components/boton-regresar/boton-regresar.component';
import { HeaderComponent } from '@shared/components/header/header.component';
import { StatusBinaryReadOnlyComponent } from '@shared/components/status-binary-read-only/status-binary-read-only.component';
import { DatetimePipe } from '@shared/pipes/datetime.pipe';
import {
  CatalogTableState,
  localPageSource,
  NativeColumn,
  NativeTableComponent,
  NATIVE_TABLE_IMPORTS,
  readPath,
} from '@shared/ui/native-table';
import { map, Observable, of, tap } from 'rxjs';
import { EditarComponent } from '../editar/editar.component';
import { EliminarComponent } from '../eliminar/eliminar.component';
import { RegistrarCategoriaProductoComponent } from '../registrar/registrar.component';
import { CategoriaProductoApiService } from '../services/categoria-producto.api.service';
import { CategoriaProductoResponseDto } from '../services/dtos/categoria-producto.response.dto';

const ESTADO = [
  { value: 'true', label: 'Activo' },
  { value: 'false', label: 'Inactivo' },
];

/** Fila del árbol aplanado: la categoría con su profundidad y sus subcategorías directas. */
interface CategoriaFila extends CategoriaProductoResponseDto {
  depth: number;
  subcategorias: CategoriaFila[];
}

@Component({
  selector: 'app-principal',
  imports: [
    CommonModule,
    BotonRegresarComponent,
    HeaderComponent,
    AppPrimengModule,
    RegistrarCategoriaProductoComponent,
    EditarComponent,
    DatetimePipe,
    StatusBinaryReadOnlyComponent,
    EliminarComponent,
    ...NATIVE_TABLE_IMPORTS,
  ],
  templateUrl: './principal.component.html',
  styleUrl: './principal.component.scss',
})
export class PrincipalComponent implements OnInit, OnDestroy {
  private readonly api = inject(CategoriaProductoApiService);
  readonly expandedRows = signal<Record<string, boolean>>({});
  detalleVisible = false;
  detalleTitulo = '';
  detalle: any = null;
  @ViewChild(RegistrarCategoriaProductoComponent) registrarComponent!: RegistrarCategoriaProductoComponent;
  @ViewChild(EditarComponent) editarComponent!: EditarComponent;
  @ViewChild(EliminarComponent) eliminarComponent!: EliminarComponent;
  @ViewChild(NativeTableComponent)
  set nativeTable(table: NativeTableComponent | undefined) {
    this.page.table = table;
  }

  // Sin ordenamiento por columna: el orden de las filas es el del árbol (padre seguido de sus hijas).
  readonly columns: NativeColumn<CategoriaFila>[] = [
    { id: 'expand', label: '', width: 56, minWidth: 48, sortable: false, tooltip: false, resizable: false, align: 'left' },
    { id: 'index', label: 'ID', width: 72, minWidth: 56, sortable: false, tooltip: false, align: 'left' },
    { id: 'nombre', label: 'Nombre', field: 'nombre', width: 260, sortable: false, filter: { type: 'text' }, align: 'left' },
    { id: 'nombreCategoriaPadre', label: 'Categoría padre', width: 200, sortable: false, filter: { type: 'text' }, align: 'left' },
    { id: 'createdAt', label: 'Creado', width: 170, sortable: false, filter: { type: 'date' }, align: 'left' },
    { id: 'updatedAt', label: 'Actualizado', width: 170, sortable: false, filter: { type: 'date' }, align: 'left' },
    { id: 'enabled', label: 'Estado', width: 120, sortable: false, filter: { type: 'select', options: ESTADO }, align: 'left' },
    { id: 'acciones', label: 'Acciones', width: 270, minWidth: 260, sortable: false, tooltip: false, align: 'center' },
  ];

  /** Lista pedida al servidor una vez; después se reconstruye el árbol desde `listAll` (que actualizan los diálogos). */
  private fetched = false;
  private lastList: unknown = this.api.listAll();
  private readonly source = localPageSource<CategoriaFila>(() => this.load(), this.columns, {
    value: (row, key) => {
      if (key === 'updatedAt') return row.updatedAt || row.createdAt;
      if (key === 'enabled') return String(!!row.enabled);
      if (key === 'nombreCategoriaPadre') return row.nombreCategoriaPadre || 'Raíz';
      return readPath(row, key);
    },
  });
  readonly page = new CatalogTableState<CategoriaFila>(this.source.request);

  constructor() {
    effect(() => {
      const list = this.api.listAll();
      if (list !== this.lastList) untracked(() => this.reload());
    });
  }

  ngOnInit(): void {
    this.page.resetAndLoad();
  }

  ngOnDestroy(): void {
    this.page.destroy();
  }

  private load(): Observable<CategoriaFila[]> {
    const base$ = this.fetched
      ? of(this.api.listAll())
      : this.api.getAll().pipe(
          tap((categorias) => {
            this.fetched = true;
            const padresConHijas = new Set(
              categorias.map((categoria) => categoria.idCategoriaPadre).filter((id): id is string => !!id),
            );
            this.expandedRows.set(Object.fromEntries([...padresConHijas].map((id) => [id, true])));
          }),
        );
    return base$.pipe(
      map((list) => {
        this.lastList = list;
        return this.aplanar(list ?? []);
      }),
    );
  }

  private aplanar(list: CategoriaProductoResponseDto[]): CategoriaFila[] {
    const nodos = new Map<string, CategoriaFila>(
      list.map((item) => [item.idCategoria, { ...item, depth: 0, subcategorias: [] }]),
    );
    const raices: CategoriaFila[] = [];
    for (const item of list) {
      const nodo = nodos.get(item.idCategoria)!;
      const padre = item.idCategoriaPadre ? nodos.get(item.idCategoriaPadre) : undefined;
      if (padre) padre.subcategorias.push(nodo);
      else raices.push(nodo);
    }
    const expandidas = this.expandedRows();
    const filas: CategoriaFila[] = [];
    const visitar = (items: CategoriaFila[], depth: number) =>
      items.forEach((nodo) => {
        nodo.depth = depth;
        filas.push(nodo);
        if (expandidas[nodo.idCategoria]) visitar(nodo.subcategorias, depth + 1);
      });
    visitar(raices, 0);
    return filas;
  }

  private reload(): void {
    this.source.invalidate();
    this.page.resetAndLoad();
  }

  toggleRow(item: { idCategoria: string }): void {
    this.expandedRows.update((rows) => ({ ...rows, [item.idCategoria]: !rows[item.idCategoria] }));
    this.reload();
  }

  displayCreate(): void {
    this.registrarComponent.display = true;
  }

  displayUpdate(itemDto: CategoriaProductoResponseDto): void {
    this.editarComponent.itemDto.set({ ...itemDto });
    this.editarComponent.display = true;
  }

  displayDelete(itemDto: CategoriaProductoResponseDto): void {
    this.eliminarComponent.itemDto.set({ ...itemDto });
    this.eliminarComponent.display = true;
  }

  verProductos(item: CategoriaProductoResponseDto): void {
    this.api.getProductos(item.idCategoria).subscribe({
      next: (detalle) => this.mostrarDetalle(`Productos de ${item.nombre}`, detalle),
      error: (error) => this.mostrarError(error),
    });
  }

  verRecuento(item: CategoriaProductoResponseDto): void {
    this.api.getRecuento(item.idCategoria).subscribe({
      next: (detalle) => this.mostrarDetalle(`Recuento de ${item.nombre}`, detalle),
      error: (error) => this.mostrarError(error),
    });
  }

  verExistencia(item: CategoriaProductoResponseDto): void {
    this.api.getExistencia(item.idCategoria).subscribe({
      next: (detalle) => this.mostrarDetalle(`Existencia de ${item.nombre}`, detalle),
      error: (error) => this.mostrarError(error),
    });
  }

  private mostrarDetalle(titulo: string, detalle: any): void {
    this.detalleTitulo = titulo;
    this.detalle = detalle;
    this.detalleVisible = true;
  }

  private mostrarError(error: any): void {
    this.detalleTitulo = 'No se pudo cargar el detalle';
    this.detalle = { error: error?.error?.message || 'Intenta nuevamente.' };
    this.detalleVisible = true;
  }
}
