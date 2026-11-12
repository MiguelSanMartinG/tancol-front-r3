import { NativeColumn, Pin } from './native-table.types';

export function columnWidth(col: NativeColumn, widths: Record<string, number>): number {
  return widths[col.id] ?? col.width ?? 120;
}

export function autoPinSide(
  col: NativeColumn,
  columns: readonly NativeColumn[],
  widths: Record<string, number>,
): Pin {
  let total = 0;
  let start = 0;
  let colW = 120;
  let found = false;
  for (const current of columns) {
    const w = columnWidth(current, widths);
    if (!found) {
      if (current.id === col.id) {
        found = true;
        colW = w;
      } else {
        start += w;
      }
    }
    total += w;
  }
  const distLeft = start;
  const distRight = Math.max(0, total - (start + colW));
  return distLeft <= distRight ? 'left' : 'right';
}

export interface PinVisual {
  natural: number;
  rightLimit: number;
  visual: number;
  stuckLeft: boolean;
  stuckRight: boolean;
}

export function computePinVisual(
  columnStart: number,
  columnWidthPx: number,
  scrollLeft: number,
  visibleWidth: number,
  insetLeft: number,
  insetRight: number,
): PinVisual {
  const natural = columnStart - scrollLeft;
  const rightLimit = visibleWidth - columnWidthPx - insetRight;
  const visual = Math.max(insetLeft, Math.min(natural, rightLimit));
  return {
    natural,
    rightLimit,
    visual,
    stuckLeft: natural < insetLeft,
    stuckRight: natural > rightLimit,
  };
}
