import { NativeTableComponent } from './native-table.component';
import { TcNativeTableCellDirective } from './native-table-cell.directive';
import { TcNativeTableEmptyDirective } from './native-table-empty.directive';
import { allocateVirtual, isPlaceholder, placeChunk } from './math';

export { NativeTableComponent } from './native-table.component';
export { TcNativeTableCellDirective } from './native-table-cell.directive';
export { TcNativeTableEmptyDirective } from './native-table-empty.directive';
export { PageFetchController } from './page-fetch.controller';
export { CatalogTableState, catalogPageParams } from './catalog-page';
export type { CatalogPageQuery, CatalogPageResponse } from './catalog-page';
export { cycleSort, sortKeyOf, sortToParams } from './native-table-sort';
export { filtersToParams, formatRange, isFilterActive, parseRange } from './native-table-filter';
export * from './native-table.types';
export {
  VIRTUAL_PAGE_SIZE_DEFAULT,
  VIRTUAL_PAGE_SIZE_OPTIONS,
  allocateVirtual,
  chunkStart,
  isPlaceholder,
  placeChunk,
  totalAfterChunk,
} from './math';

export function allocateNativeVirtual<T extends object>(
  total: number,
  keep: readonly (T & { placeholder?: boolean })[] = [],
): (T & { placeholder?: boolean })[] {
  return allocateVirtual(
    total,
    keep,
    (row) => isPlaceholder(row),
    () => ({ placeholder: true }) as T & { placeholder?: boolean },
  );
}

export function ensureNativeBuffer<T extends object>(
  rows: readonly (T & { placeholder?: boolean })[],
  total: number,
): (T & { placeholder?: boolean })[] {
  return allocateNativeVirtual(total, rows);
}

export function placeNativeChunk<T extends object>(
  virtual: readonly (T & { placeholder?: boolean })[],
  start: number,
  incoming: readonly T[] | null | undefined,
): (T & { placeholder?: boolean })[] {
  return placeChunk(virtual, start, incoming);
}

export const NATIVE_TABLE_IMPORTS = [
  NativeTableComponent,
  TcNativeTableCellDirective,
  TcNativeTableEmptyDirective,
] as const;
