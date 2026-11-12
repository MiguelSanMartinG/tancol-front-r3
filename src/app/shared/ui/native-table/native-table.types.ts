export type Pin = 'left' | 'right';

export type FilterKind = 'text' | 'number' | 'date' | 'select' | 'select-multi';

export interface FilterOption {
  value: string | number;
  label: string;
}

export interface FilterDef {
  type: FilterKind;
  options?: FilterOption[];
}

export type FilterValue = string | number | null | (string | number)[];

export type NativeFilters = Record<string, FilterValue>;

export interface NativeSort {
  key: string;
  direction: 'ASC' | 'DESC';
}

export interface NativeColumn<T = Record<string, unknown>> {
  id: string;
  label: string;
  field?: keyof T & string;
  width?: number;
  minWidth?: number;
  maxWidth?: number;
  resizable?: boolean;
  sortable?: boolean;
  sortKey?: string;
  filter?: FilterDef;
  align?: 'left' | 'center' | 'right';
  cellClass?: string;
  tooltip?: boolean;
  pinned?: Pin | null;
  pinnable?: boolean;
}

export type NativeRow = Record<string, unknown> & { placeholder?: boolean };

export interface VisibleRangeChange {
  start: number;
  end: number;
  pages: number[];
}

export interface RowActivateEvent<T = NativeRow> {
  row: T;
  index: number;
}

export interface NativeCellContext {
  $implicit: NativeRow;
  index: number;
}
