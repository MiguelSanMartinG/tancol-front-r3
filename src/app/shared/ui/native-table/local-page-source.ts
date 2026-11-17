import { Observable, map, of, tap } from 'rxjs';
import { CatalogPageQuery, CatalogPageResponse } from './catalog-page';
import { isFilterActive, parseRange } from './native-table-filter';
import { FilterKind, NativeColumn, NativeFilters, NativeSort } from './native-table.types';

/**
 * Fuente de páginas local para `CatalogTableState`: para pantallas cuyo back no tiene endpoint
 * `/page`. Carga la lista completa una vez por recarga (página 1) y pagina, filtra, ordena y busca
 * en el navegador con la misma semántica de filtros que el back (texto contiene, select igual,
 * rangos `desde..hasta` en número y fecha).
 *
 * Uso:
 *   readonly source = localPageSource(() => this.api.getAll(), this.columns, { value: (row, key) => ... });
 *   readonly page = new CatalogTableState<T>(this.source.request);
 */
export interface LocalPageSourceOptions<T> {
  /** Valor de una columna/llave para filtrar, ordenar y buscar. Por defecto lee la ruta `a.b.c` del objeto. */
  value?: (row: T, key: string) => unknown;
  /** Llaves que entran en la búsqueda global. Por defecto, todas las columnas con `field` o filtro. */
  searchKeys?: string[];
}

export interface LocalPageSource<T> {
  request: (query: CatalogPageQuery) => Observable<CatalogPageResponse<T>>;
  /** Fuerza que la siguiente consulta vuelva a pedir la lista al servidor. */
  invalidate: () => void;
}

export function localPageSource<T extends object>(
  load: () => Observable<T[]>,
  columns: NativeColumn<any>[],
  options: LocalPageSourceOptions<T> = {},
): LocalPageSource<T> {
  let cache: T[] | null = null;
  const valueOf = options.value ?? ((row: T, key: string) => readPath(row, key));
  const kinds = new Map<string, FilterKind>();
  for (const col of columns) {
    if (col.filter) kinds.set(col.id, col.filter.type);
  }
  const searchKeys =
    options.searchKeys ?? columns.filter((c) => c.field || c.filter).map((c) => c.field ?? c.id);

  const request = (query: CatalogPageQuery): Observable<CatalogPageResponse<T>> => {
    const source$ = query.page === 1 || cache == null
      ? load().pipe(tap((items) => (cache = items ?? [])))
      : of(cache);
    return source$.pipe(
      map(() => {
        const all = cache ?? [];
        const filtered = aplicarSort(
          aplicarBusqueda(aplicarFiltros(all, query.filters, kinds, valueOf), query.search, searchKeys, valueOf),
          query.sort,
          valueOf,
        );
        const start = (query.page - 1) * query.pageSize;
        return {
          items: filtered.slice(start, start + query.pageSize),
          total: filtered.length,
          page: query.page,
          pageSize: query.pageSize,
        };
      }),
    );
  };

  return { request, invalidate: () => (cache = null) };
}

export function readPath(obj: unknown, path: string): unknown {
  let current: unknown = obj;
  for (const part of path.split('.')) {
    if (current == null || typeof current !== 'object') return undefined;
    current = (current as Record<string, unknown>)[part];
  }
  return current;
}

export function normalizar(value: unknown): string {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim();
}

function aplicarFiltros<T>(
  rows: T[],
  filters: NativeFilters,
  kinds: Map<string, FilterKind>,
  valueOf: (row: T, key: string) => unknown,
): T[] {
  const activos = Object.entries(filters ?? {}).filter(([, v]) => isFilterActive(v));
  if (!activos.length) return rows;
  return rows.filter((row) =>
    activos.every(([key, filtro]) => {
      const valor = valueOf(row, key);
      switch (kinds.get(key) ?? 'text') {
        case 'select':
          return String(valor ?? '') === String(filtro);
        case 'select-multi':
          return Array.isArray(filtro) && filtro.map(String).includes(String(valor ?? ''));
        case 'number': {
          const { from, to } = parseRange(filtro ?? undefined);
          const n = Number(valor);
          if (valor == null || Number.isNaN(n)) return false;
          return (from === '' || n >= Number(from)) && (to === '' || n <= Number(to));
        }
        case 'date': {
          const { from, to } = parseRange(filtro ?? undefined);
          const dia = fechaIso(valor);
          if (!dia) return false;
          return (from === '' || dia >= from.slice(0, 10)) && (to === '' || dia <= to.slice(0, 10));
        }
        default:
          return normalizar(valor).includes(normalizar(filtro));
      }
    }),
  );
}

function aplicarBusqueda<T>(
  rows: T[],
  search: string | undefined,
  keys: string[],
  valueOf: (row: T, key: string) => unknown,
): T[] {
  const termino = normalizar(search);
  if (!termino) return rows;
  return rows.filter((row) => keys.some((key) => normalizar(valueOf(row, key)).includes(termino)));
}

function aplicarSort<T>(rows: T[], sort: NativeSort | null, valueOf: (row: T, key: string) => unknown): T[] {
  if (!sort) return rows;
  const factor = sort.direction === 'DESC' ? -1 : 1;
  return [...rows].sort((a, b) => factor * comparar(valueOf(a, sort.key), valueOf(b, sort.key)));
}

function comparar(a: unknown, b: unknown): number {
  if (a == null && b == null) return 0;
  if (a == null) return 1;
  if (b == null) return -1;
  if (typeof a === 'number' && typeof b === 'number') return a - b;
  if (typeof a === 'boolean' && typeof b === 'boolean') return Number(a) - Number(b);
  return normalizar(a).localeCompare(normalizar(b), 'es', { numeric: true });
}

/** 'yyyy-MM-dd' de un valor de fecha (ISO del back, Date o 'dd-MM-yyyy'). */
function fechaIso(valor: unknown): string | null {
  if (valor == null || valor === '') return null;
  if (valor instanceof Date) {
    const y = valor.getFullYear();
    const m = String(valor.getMonth() + 1).padStart(2, '0');
    const d = String(valor.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
  const texto = String(valor);
  const iso = texto.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;
  const mx = texto.match(/^(\d{2})[-/](\d{2})[-/](\d{4})/);
  if (mx) return `${mx[3]}-${mx[2]}-${mx[1]}`;
  return null;
}
