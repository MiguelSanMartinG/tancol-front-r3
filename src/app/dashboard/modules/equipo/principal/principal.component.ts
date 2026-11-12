import { Component, computed, inject, OnDestroy, OnInit, signal, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AppPrimengModule } from '@shared/app-primeng/app-primeng.module';
import { BotonRegresarComponent } from '@shared/components/boton-regresar/boton-regresar.component';
import { HeaderComponent } from '@shared/components/header/header.component';
import { DatetimePipe } from '@shared/pipes/datetime.pipe';
import {
  ensureNativeBuffer,
  NativeColumn,
  NativeFilters,
  NativeSort,
  NativeTableComponent,
  PageFetchController,
  placeNativeChunk,
  TcNativeTableCellDirective,
  TcNativeTableEmptyDirective,
  totalAfterChunk,
  VisibleRangeChange,
} from '@shared/ui/native-table';
import { TipoEquipoApiService } from '../../tipo-equipo/services/tipo-equipo.api.service';
import { EquipoEliminarComponent } from '../eliminar/eliminar.component';
import { EquipoApiService } from '../services/equipo.api.service';
import { EquipoResponse } from '../services/equipo.response';

@Component({
  selector: 'app-equipo-principal',
  templateUrl: './principal.component.html',
  styleUrl: './principal.component.scss',
  imports: [
    AppPrimengModule,
    BotonRegresarComponent,
    HeaderComponent,
    DatetimePipe,
    EquipoEliminarComponent,
    NativeTableComponent,
    TcNativeTableCellDirective,
    TcNativeTableEmptyDirective,
  ],
})
export class EquipoPrincipalComponent implements OnInit, OnDestroy {
  private readonly api = inject(EquipoApiService);
  private readonly tipoEquipoApi = inject(TipoEquipoApiService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly fetchCtrl = new PageFetchController();
  private readonly loadedPages = new Set<number>();
  private loadGen = 0;
  private searchTimer: ReturnType<typeof setTimeout> | null = null;

  @ViewChild(EquipoEliminarComponent) eliminarComponent!: EquipoEliminarComponent;
  @ViewChild(NativeTableComponent) nativeTable?: NativeTableComponent;

  readonly rows = signal<(EquipoResponse & { placeholder?: boolean })[]>([]);
  readonly total = signal(0);
  readonly loading = signal(false);
  readonly pageSize = signal(50);
  readonly sort = signal<NativeSort | null>(null);
  readonly filters = signal<NativeFilters>({});
  readonly selectedIndex = signal(-1);
  readonly tipoOptions = signal<{ value: string; label: string }[]>([]);
  searchDraft = '';

  readonly estadoOptions = [
    { value: 'DISPONIBLE', label: 'Disponible' },
    { value: 'ASIGNADO', label: 'Asignado' },
    { value: 'BAJA', label: 'Baja' },
  ];

  readonly columns = computed<NativeColumn<EquipoResponse>[]>(() => [
    { id: 'index', label: 'ID', width: 72, minWidth: 56, sortable: false, tooltip: false, align: 'left' },
    { id: 'nombre', label: 'Nombre', field: 'nombre', width: 200, filter: { type: 'text' }, align: 'center' },
    { id: 'sku', label: 'SKU', field: 'sku', width: 140, filter: { type: 'text' }, align: 'center' },
    { id: 'marca', label: 'Marca', field: 'marca', width: 150, filter: { type: 'text' }, align: 'center' },
    { id: 'modelo', label: 'Modelo', field: 'modelo', width: 150, filter: { type: 'text' }, align: 'center' },
    {
      id: 'idTipoEquipo',
      label: 'Tipo',
      width: 170,
      sortKey: 'nombreTipoEquipo',
      filter: { type: 'select', options: this.tipoOptions() },
      align: 'center',
    },
    {
      id: 'estado',
      label: 'Estado',
      width: 140,
      filter: { type: 'select', options: this.estadoOptions },
      align: 'center',
    },
    { id: 'cliente', label: 'Cliente asignado', width: 200, sortable: false, filter: { type: 'text' }, align: 'center' },
    { id: 'createdAt', label: 'Creado', field: 'createdAt', width: 170, filter: { type: 'date' }, align: 'center' },
    { id: 'acciones', label: 'Acciones', width: 120, sortable: false, tooltip: false, align: 'center' },
  ]);

  ngOnInit(): void {
    this.tipoEquipoApi.getAll().subscribe((data) => {
      this.tipoOptions.set(data.map((row) => ({ value: row.id, label: row.nombre })));
    });
    this.resetAndLoad();
  }

  ngOnDestroy(): void {
    this.fetchCtrl.cancelAll();
    if (this.searchTimer != null) clearTimeout(this.searchTimer);
  }

  resetAndLoad(): void {
    this.fetchCtrl.cancelAll();
    this.loadedPages.clear();
    this.loadGen += 1;
    const gen = this.loadGen;
    this.total.set(0);
    this.rows.set([]);
    this.loading.set(true);
    this.selectedIndex.set(-1);
    this.nativeTable?.scrollToStart();
    this.fetchPage(1, true, gen);
  }

  onVisibleRange(range: VisibleRangeChange): void {
    if (this.loading()) return;
    this.fetchCtrl.retain(range.pages);
    for (const page of range.pages) {
      if (!this.loadedPages.has(page)) this.fetchPage(page, false, this.loadGen);
    }
  }

  onSort(sort: NativeSort | null): void {
    this.sort.set(sort);
    this.resetAndLoad();
  }

  onFilters(filters: NativeFilters): void {
    this.filters.set(filters);
    this.resetAndLoad();
  }

  onPageSize(pageSize: number): void {
    this.pageSize.set(pageSize);
    this.resetAndLoad();
  }

  onSearch(value: string): void {
    this.searchDraft = value;
    if (this.searchTimer != null) clearTimeout(this.searchTimer);
    this.searchTimer = setTimeout(() => this.resetAndLoad(), 300);
  }

  clearQuery(): void {
    if (this.searchTimer != null) clearTimeout(this.searchTimer);
    this.searchDraft = '';
    this.sort.set(null);
    this.filters.set({});
    this.resetAndLoad();
  }

  estadoLabel(value: string | null | undefined): string {
    return this.estadoOptions.find((option) => option.value === value)?.label ?? (value || '-');
  }

  texto(value: string | null | undefined): string {
    const text = value?.trim();
    return text ? text : '-';
  }

  crear(): void {
    this.router.navigate(['../crear'], { relativeTo: this.route });
  }

  editar(item: EquipoResponse): void {
    this.router.navigate(['../actualizar', item.id], { relativeTo: this.route });
  }

  eliminar(item: EquipoResponse): void {
    this.eliminarComponent.item.set(item);
    this.eliminarComponent.display = true;
  }

  private fetchPage(page: number, isReset: boolean, gen: number): void {
    const sub = this.api.getPage({
      page,
      pageSize: this.pageSize(),
      search: this.searchDraft.trim(),
      filters: this.filters(),
      sort: this.sort(),
    }).subscribe({
      next: (res) => {
        if (gen !== this.loadGen) return;
        this.loadedPages.add(page);
        const start = (page - 1) * this.pageSize();
        const items = res.items ?? [];
        const nextTotal = totalAfterChunk(start, items.length, this.pageSize(), res.total);
        this.rows.update((current) => placeNativeChunk(ensureNativeBuffer(current, nextTotal), start, items));
        this.total.set(nextTotal);
        if (isReset) {
          this.nativeTable?.scrollToStart();
          this.loading.set(false);
        }
      },
      error: () => {
        if (gen !== this.loadGen) return;
        if (isReset) this.loading.set(false);
      },
    });
    this.fetchCtrl.track(page, sub);
  }
}
