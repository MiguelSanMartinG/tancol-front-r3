import { FilterValue, NativeFilters } from './native-table.types';

export function isFilterActive(value: FilterValue | undefined): boolean {
  if (value == null) return false;
  if (Array.isArray(value)) return value.length > 0;
  return String(value).trim() !== '';
}

export function filtersToParams(filters: NativeFilters): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(filters)) {
    if (!isFilterActive(value) || value == null) continue;
    out[`filter_${key}`] = Array.isArray(value) ? value.join(',') : String(value);
  }
  return out;
}

export function parseRange(value: FilterValue | undefined): { from: string; to: string } {
  const raw = typeof value === 'string' || typeof value === 'number' ? String(value) : '';
  const splitAt = raw.indexOf('..');
  if (splitAt < 0) return { from: raw, to: '' };
  return { from: raw.slice(0, splitAt), to: raw.slice(splitAt + 2) };
}

export function formatRange(from: string, to: string): string | null {
  const left = from.trim();
  const right = to.trim();
  if (!left && !right) return null;
  return `${left}..${right}`;
}
