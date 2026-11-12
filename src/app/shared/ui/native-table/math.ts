/**
 * Portable virtual-list + block-paginator math.
 * Keep in sync with virtual-infinite-scroll-table skill math.ts.
 */

export const VIRTUAL_PAGE_SIZE_DEFAULT = 50;
export const VIRTUAL_PAGE_SIZE_OPTIONS: number[] = [25, 50, 100];
export const VIRTUAL_OVERSCAN = 8;

export type VirtualRow<T extends object = object> = T & {
  placeholder?: boolean;
};

export function bottomPad(total: number, end: number, rowHeight: number): number {
  return Math.max(0, total - Math.max(0, end)) * Math.max(1, rowHeight);
}

export function visibleRange(
  scrollTop: number,
  viewportHeight: number,
  rowHeight: number,
  total: number,
  overscan = VIRTUAL_OVERSCAN,
): { start: number; end: number; offsetY: number } {
  const height = Math.max(1, rowHeight);
  const count = Math.max(0, total);
  if (count === 0) return { start: 0, end: 0, offsetY: 0 };
  const start = Math.max(0, Math.floor(Math.max(0, scrollTop) / height) - overscan);
  const visible = Math.ceil(Math.max(1, viewportHeight) / height) + overscan * 2;
  const end = Math.min(count, start + visible);
  return { start, end, offsetY: start * height };
}

export function pageCount(total: number, pageSize: number): number {
  if (total <= 0) return 1;
  return Math.ceil(total / Math.max(1, pageSize));
}

export function pagerPages(page: number, pageCountValue: number, windowSize = 5): number[] {
  const count = Math.max(1, pageCountValue);
  const current = Math.min(count, Math.max(1, page));
  const size = Math.max(1, windowSize);
  let from = Math.max(1, current - Math.floor((size - 1) / 2));
  let to = Math.min(count, from + size - 1);
  from = Math.max(1, to - size + 1);
  const pages: number[] = [];
  for (let p = from; p <= to; p++) pages.push(p);
  return pages;
}

export function pageFromFirst(first: number, rows: number): number {
  const size = Math.max(1, rows || VIRTUAL_PAGE_SIZE_DEFAULT);
  return Math.floor(Math.max(0, first) / size) + 1;
}

export function chunkStart(page: number, pageSize: number): number {
  return (Math.max(1, page) - 1) * Math.max(1, pageSize);
}

export function pagesForRange(
  first: number,
  last: number,
  pageSize: number,
  total: number,
): number[] {
  if (total <= 0) return [1];
  const size = Math.max(1, pageSize);
  const start = Math.max(0, first);
  const end = Math.min(total - 1, Math.max(start, last - 1));
  const from = Math.floor(start / size) + 1;
  const to = Math.floor(end / size) + 1;
  const pages: number[] = [];
  for (let page = from; page <= to; page++) pages.push(page);
  return pages;
}

export function maxScroll(total: number, rowHeight: number, viewportHeight: number): number {
  return Math.max(0, Math.max(0, total) * Math.max(1, rowHeight) - Math.max(1, viewportHeight));
}

export function contentFits(total: number, rowHeight: number, viewportHeight: number): boolean {
  if (total <= 0) return false;
  return total * Math.max(1, rowHeight) <= Math.max(1, viewportHeight) + 1;
}

export function scrollTopForPage(
  page: number,
  pageSize: number,
  rowHeight: number,
  total: number,
  viewportHeight: number,
): number {
  const unclamped = chunkStart(page, pageSize) * Math.max(1, rowHeight);
  return Math.min(unclamped, maxScroll(total, rowHeight, viewportHeight));
}

export function pageFromScroll(
  scrollTop: number,
  rowHeight: number,
  pageSize: number,
  total: number,
  viewportHeight: number,
): number {
  const count = pageCount(total, pageSize);
  if (total <= 0) return 1;
  const max = maxScroll(total, rowHeight, viewportHeight);
  if (max <= 0) return 1;
  if (scrollTop >= max - 1) return count;
  const row = Math.floor(Math.max(0, scrollTop) / Math.max(1, rowHeight));
  return Math.min(count, pageFromFirst(row, pageSize));
}

export function totalAfterChunk(
  start: number,
  incomingLength: number,
  pageSize: number,
  reportedTotal: number,
): number {
  const placed = Math.max(0, start) + Math.max(0, incomingLength);
  if (incomingLength > 0 && incomingLength < Math.max(1, pageSize)) return placed;
  return Math.max(Math.max(0, reportedTotal), placed);
}

export function isPlaceholder(row: { placeholder?: boolean } | null | undefined): boolean {
  return !row || row.placeholder === true;
}

export function allocateVirtual<T>(
  total: number,
  keep: readonly T[] = [],
  rowIsPlaceholder: (row: T | undefined) => boolean,
  placeholderAt: (index: number) => T,
): T[] {
  return Array.from({ length: Math.max(0, total) }, (_, index) => {
    const prev = keep[index];
    if (prev && !rowIsPlaceholder(prev)) return prev;
    return placeholderAt(index);
  });
}

export function placeChunk<T extends object>(
  virtual: readonly T[],
  start: number,
  incoming: readonly T[] | null | undefined,
): T[] {
  const next = (virtual ?? []).slice();
  (incoming ?? []).forEach((row, offset) => {
    const at = start + offset;
    if (at >= 0 && at < next.length) next[at] = { ...row, placeholder: false };
  });
  return next;
}

export function nextRowIndex(current: number, delta: number, total: number): number {
  if (total <= 0) return 0;
  return Math.min(total - 1, Math.max(0, current + delta));
}

export function nextLoadedIndex(
  current: number,
  delta: number,
  total: number,
  isLoaded: (index: number) => boolean,
): number {
  if (total <= 0) return 0;
  const step = delta < 0 ? -1 : 1;
  let index = nextRowIndex(current, step, total);
  while (!isLoaded(index)) {
    const next = nextRowIndex(index, step, total);
    if (next === index) return isLoaded(current) ? current : index;
    index = next;
  }
  return index;
}

export function scrollTopForRow(
  index: number,
  rowHeight: number,
  viewportHeight: number,
  currentScrollTop: number,
): number {
  const height = Math.max(1, rowHeight);
  const viewH = Math.max(1, viewportHeight);
  const rowTop = Math.max(0, index) * height;
  const rowBottom = rowTop + height;
  const viewTop = Math.max(0, currentScrollTop);
  const viewBottom = viewTop + viewH;
  if (rowTop < viewTop) return rowTop;
  if (rowBottom > viewBottom) return Math.max(0, rowBottom - viewH);
  return viewTop;
}

export function rowNavDelta(event: { key: string }): -1 | 1 | 0 {
  const up = event.key === 'ArrowUp' || event.key === 'w' || event.key === 'W';
  const down = event.key === 'ArrowDown' || event.key === 's' || event.key === 'S';
  if (up) return -1;
  if (down) return 1;
  return 0;
}

export function isTypingTarget(
  target: EventTarget | null,
  extraSelectors: string[] = [],
): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true;
  if (target.isContentEditable) return true;
  for (const sel of extraSelectors) {
    if (target.closest(sel)) return true;
  }
  return false;
}
