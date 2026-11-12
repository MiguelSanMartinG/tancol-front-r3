import { NativeColumn, NativeSort } from './native-table.types';

export function sortKeyOf(col: Pick<NativeColumn, 'id' | 'field' | 'sortKey'>): string {
  return col.sortKey ?? col.field ?? col.id;
}

export function cycleSort(current: NativeSort | null, key: string): NativeSort | null {
  if (!current || current.key !== key) return { key, direction: 'ASC' };
  if (current.direction === 'ASC') return { key, direction: 'DESC' };
  return null;
}

export function sortToParams(sort: NativeSort | null): Record<string, string> {
  if (!sort) return {};
  return { [`sort_${sort.key}`]: sort.direction };
}
