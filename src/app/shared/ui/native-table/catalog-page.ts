import { HttpParams } from '@angular/common/http';
import { signal } from '@angular/core';
import { Observable } from 'rxjs';
import { filtersToParams } from './native-table-filter';
import { NativeTableComponent } from './native-table.component';
import { sortToParams } from './native-table-sort';
import { NativeFilters, NativeSort, VisibleRangeChange } from './native-table.types';
import { PageFetchController } from './page-fetch.controller';
import { allocateVirtual, isPlaceholder, placeChunk, totalAfterChunk } from './math';

export interface CatalogPageQuery {
  page: number;
  pageSize: number;
  search?: string;
  filters: NativeFilters;
  sort: NativeSort | null;
}

export interface CatalogPageResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export function catalogPageParams(query: CatalogPageQuery): HttpParams {
  let params = new HttpParams()
    .set('page', String(query.page))
    .set('pageSize', String(query.pageSize));
  const search = query.search?.trim();
  if (search) params = params.set('search', search);
  const tableParams = {
    ...filtersToParams(query.filters),
    ...sortToParams(query.sort),
  };
  for (const [key, value] of Object.entries(tableParams)) {
    params = params.set(key, value);
  }
  return params;
}

export class CatalogTableState<T extends object> {
  readonly rows = signal<(T & { placeholder?: boolean })[]>([]);
  readonly total = signal(0);
  readonly loading = signal(false);
  readonly pageSize = signal(50);
  readonly sort = signal<NativeSort | null>(null);
  readonly filters = signal<NativeFilters>({});
  readonly selectedIndex = signal(-1);
  searchDraft = '';
  table?: NativeTableComponent;

  private readonly fetchCtrl = new PageFetchController();
  private readonly loadedPages = new Set<number>();
  private loadGen = 0;
  private searchTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(
    private readonly request: (query: CatalogPageQuery) => Observable<CatalogPageResponse<T>>,
  ) {}

  destroy(): void {
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
    this.table?.scrollToStart();
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

  private fetchPage(page: number, isReset: boolean, gen: number): void {
    const sub = this.request({
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
        this.rows.update((current) => placeChunk(
          ensureBuffer(current, nextTotal),
          start,
          items,
        ));
        this.total.set(nextTotal);
        if (isReset) {
          this.table?.scrollToStart();
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

function ensureBuffer<T extends object>(
  rows: readonly (T & { placeholder?: boolean })[],
  total: number,
): (T & { placeholder?: boolean })[] {
  return allocateVirtual(
    total,
    rows,
    (row) => isPlaceholder(row),
    () => ({ placeholder: true }) as T & { placeholder?: boolean },
  );
}
