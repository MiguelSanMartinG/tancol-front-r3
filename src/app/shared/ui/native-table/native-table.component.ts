import { NgTemplateOutlet } from '@angular/common';
import {
  AfterRenderRef,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ContentChild,
  ContentChildren,
  DestroyRef,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  OnChanges,
  Output,
  QueryList,
  SimpleChanges,
  ViewChild,
  ViewChildren,
  afterNextRender,
  afterRender,
  inject,
} from '@angular/core';
import { TcNativeTableCellDirective } from './native-table-cell.directive';
import { TcNativeTableEmptyDirective } from './native-table-empty.directive';
import { isFilterActive, parseRange } from './native-table-filter';
import { autoPinSide, columnWidth, computePinVisual } from './native-table-pin';
import { cycleSort, sortKeyOf } from './native-table-sort';
import {
  FilterValue,
  NativeColumn,
  NativeFilters,
  NativeRow,
  NativeSort,
  Pin,
  RowActivateEvent,
  VisibleRangeChange,
} from './native-table.types';
import {
  VIRTUAL_PAGE_SIZE_OPTIONS,
  bottomPad,
  isPlaceholder,
  isTypingTarget,
  nextLoadedIndex,
  pageCount,
  pageFromScroll,
  pagerPages,
  pagesForRange,
  rowNavDelta,
  scrollTopForPage,
  scrollTopForRow,
  visibleRange,
} from './math';

interface ColumnMenuState {
  col: NativeColumn;
  x: number;
  y: number;
  view: 'actions' | 'filter';
}

const MENU_WIDTH = 260;

@Component({
  selector: 'tc-native-table',
  standalone: true,
  imports: [NgTemplateOutlet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './native-table.component.html',
  styleUrl: './native-table.component.scss',
})
export class NativeTableComponent implements OnChanges {
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly host = inject(ElementRef<HTMLElement>);
  private readonly destroyRef = inject(DestroyRef);

  @Input() columns: NativeColumn<any>[] = [];
  @Input() rows: any[] = [];
  @Input() total = 0;
  @Input() rowHeight = 40;
  @Input() pageSize = 50;
  @Input() pageSizeOptions: number[] = VIRTUAL_PAGE_SIZE_OPTIONS;
  @Input() loading = false;
  @Input() selectedIndex = -1;
  @Input() sort: NativeSort | null = null;
  @Input() filters: NativeFilters = {};
  @Input() keyboardNav = true;
  @Input() storageKey = '';

  @Output() readonly selectedIndexChange = new EventEmitter<number>();
  @Output() readonly sortChange = new EventEmitter<NativeSort | null>();
  @Output() readonly filtersChange = new EventEmitter<NativeFilters>();
  @Output() readonly pageSizeChange = new EventEmitter<number>();
  @Output() readonly rowActivate = new EventEmitter<RowActivateEvent>();
  @Output() readonly visibleRangeChange = new EventEmitter<VisibleRangeChange>();

  @ContentChildren(TcNativeTableCellDirective) cellDirs!: QueryList<TcNativeTableCellDirective>;
  @ContentChild(TcNativeTableEmptyDirective) emptyDir?: TcNativeTableEmptyDirective;

  @ViewChild('viewport') viewport?: ElementRef<HTMLDivElement>;
  @ViewChild('head') head?: ElementRef<HTMLDivElement>;
  @ViewChild('headWrap') headWrap?: ElementRef<HTMLDivElement>;
  @ViewChildren('th') headerCells!: QueryList<ElementRef<HTMLElement>>;

  columnWidths: Record<string, number> = {};
  columnPins: Record<string, Pin | null> = {};
  columnMenu: ColumnMenuState | null = null;
  draftText = '';
  draftFrom = '';
  draftTo = '';
  draftSelect = '';
  draftMulti: (string | number)[] = [];

  rangeStart = 0;
  rangeEnd = 0;
  offsetY = 0;
  edgeLeftId: string | null = null;
  edgeRightId: string | null = null;
  rowNavActive = false;

  private pinsHydrated = false;
  private lastPagesKey = '';
  private resizeSnapshot: Map<string, number> | null = null;
  private manualWidths = false;
  private viewportWidth = 0;
  private layoutKey = '';
  private layoutCache = new Map<string, number>();
  private resizeObserver?: ResizeObserver;
  private resizeMove?: (event: PointerEvent) => void;
  private resizeUp?: (event: PointerEvent) => void;
  private readonly renderRef: AfterRenderRef;

  constructor() {
    afterNextRender(() => {
      this.restoreLayout();
      this.observeViewport();
      this.syncVirtualRange();
      this.alignPinnedColumns();
      this.cdr.markForCheck();
    });
    this.renderRef = afterRender({
      mixedReadWrite: () => this.alignPinnedColumns(),
    });
    this.destroyRef.onDestroy(() => {
      this.renderRef.destroy();
      this.resizeObserver?.disconnect();
      this.detachResizeListeners();
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['columns']) this.ensureWidths();
    if (changes['rows'] || changes['total'] || changes['pageSize'] || changes['rowHeight']) {
      queueMicrotask(() => {
        this.syncVirtualRange();
        this.alignPinnedColumns();
        this.cdr.markForCheck();
      });
    }
    if (changes['loading'] && changes['loading'].previousValue === true && !this.loading) {
      this.lastPagesKey = '';
      queueMicrotask(() => {
        this.syncVirtualRange();
        this.cdr.markForCheck();
      });
    }
  }

  get showSkeleton(): boolean {
    return this.loading && (this.total === 0 || this.rows.length === 0);
  }

  get showEmpty(): boolean {
    return !this.loading && this.total === 0;
  }

  get gridTemplate(): string {
    return this.columns.map((col) => `${this.widthOf(col)}px`).join(' ');
  }

  get tableWidth(): number {
    return this.columns.reduce((sum, col) => sum + this.widthOf(col), 0);
  }

  get padBottom(): number {
    return bottomPad(this.total, this.rangeEnd, this.rowHeight);
  }

  get visibleItems(): { row: NativeRow; index: number }[] {
    const slice = this.rows.slice(this.rangeStart, this.rangeEnd);
    return slice.map((row, offset) => ({ row, index: this.rangeStart + offset }));
  }

  get skeletonRows(): number[] {
    return [0, 1, 2, 3, 4, 5, 6, 7];
  }

  get currentPage(): number {
    const viewport = this.viewport?.nativeElement;
    if (!viewport) return 1;
    return pageFromScroll(viewport.scrollTop, this.rowHeight, this.pageSize, this.total, viewport.clientHeight);
  }

  get pageTotal(): number {
    return pageCount(this.total, this.pageSize);
  }

  get visiblePages(): number[] {
    return pagerPages(this.currentPage, this.pageTotal, 5);
  }

  scrollToStart(): void {
    const viewport = this.viewport?.nativeElement;
    this.lastPagesKey = '';
    if (viewport && viewport.scrollTop !== 0) viewport.scrollTop = 0;
    this.syncVirtualRange();
    this.alignPinnedColumns();
    this.cdr.markForCheck();
  }

  widthOf(col: NativeColumn): number {
    const live = this.resizeSnapshot?.get(col.id);
    if (live != null) return live;
    if (this.viewportWidth <= 0) return this.preferredWidth(col);
    return this.layoutWidths().get(col.id) ?? this.preferredWidth(col);
  }

  pinOf(col: NativeColumn): Pin | null {
    if (this.pinsHydrated || Object.prototype.hasOwnProperty.call(this.columnPins, col.id)) {
      return this.columnPins[col.id] ?? null;
    }
    return col.pinned ?? null;
  }

  isPinned(col: NativeColumn): boolean {
    return this.pinOf(col) != null;
  }

  insetLeft(col: NativeColumn): number {
    let sum = 0;
    for (const current of this.columns) {
      if (current.id === col.id) break;
      if (this.pinOf(current)) sum += this.widthOf(current);
    }
    return sum;
  }

  insetRight(col: NativeColumn): number {
    let sum = 0;
    let seen = false;
    for (const current of this.columns) {
      if (current.id === col.id) {
        seen = true;
        continue;
      }
      if (seen && this.pinOf(current)) sum += this.widthOf(current);
    }
    return sum;
  }

  columnStart(col: NativeColumn): number {
    let sum = 0;
    for (const current of this.columns) {
      if (current.id === col.id) break;
      sum += this.widthOf(current);
    }
    return sum;
  }

  cellTemplate(columnId: string): TcNativeTableCellDirective | undefined {
    return this.cellDirs?.find((dir) => dir.columnId === columnId);
  }

  fieldText(row: NativeRow, col: NativeColumn): string {
    if (!col.field) return '';
    const value = row[col.field];
    if (value == null) return '';
    return String(value);
  }

  sortMark(col: NativeColumn): string {
    const key = sortKeyOf(col);
    if (!this.sort || this.sort.key !== key) return '';
    return this.sort.direction === 'ASC' ? '↑' : '↓';
  }

  menuIndicator(col: NativeColumn): boolean {
    return isFilterActive(this.filters[col.id]) || this.isPinned(col);
  }

  onViewportScroll(): void {
    this.syncVirtualRange();
    this.alignPinnedColumns();
  }

  onSortClick(col: NativeColumn, event: Event): void {
    event.stopPropagation();
    if (col.sortable === false) return;
    this.sortChange.emit(cycleSort(this.sort, sortKeyOf(col)));
  }

  onResizeStart(event: PointerEvent, col: NativeColumn): void {
    if (col.resizable === false) return;
    event.preventDefault();
    event.stopPropagation();
    const startX = event.clientX;
    const base = new Map(this.layoutWidths());
    const startW = base.get(col.id) ?? this.preferredWidth(col);
    this.resizeSnapshot = new Map(base);
    const floor = Math.min(startW, col.minWidth ?? 56);
    const ceil = Math.max(startW, col.maxWidth ?? 640);
    this.resizeMove = (move: PointerEvent) => {
      const next = Math.min(ceil, Math.max(floor, Math.round(startW + (move.clientX - startX))));
      const frame = new Map(base);
      frame.set(col.id, next);
      this.resizeSnapshot = frame;
      this.alignPinnedColumns();
      this.cdr.markForCheck();
    };
    this.resizeUp = () => {
      const frame = this.resizeSnapshot;
      const changed = !!frame && frame.get(col.id) !== startW;
      this.resizeSnapshot = null;
      this.layoutKey = '';
      this.detachResizeListeners();
      if (changed && frame) {
        const next: Record<string, number> = { ...this.columnWidths };
        for (const item of this.columns) {
          const width = frame.get(item.id);
          if (width != null) next[item.id] = width;
        }
        this.columnWidths = next;
        this.manualWidths = true;
        this.persistWidths();
      }
      this.cdr.markForCheck();
    };
    document.addEventListener('pointermove', this.resizeMove);
    document.addEventListener('pointerup', this.resizeUp);
  }

  openMenuFromButton(event: MouseEvent, col: NativeColumn): void {
    event.preventDefault();
    event.stopPropagation();
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    if (this.columnMenu?.col.id === col.id) {
      this.columnMenu = null;
      return;
    }
    this.openMenu(col, rect.left, rect.bottom + 4);
  }

  onHeaderContext(event: MouseEvent, col: NativeColumn): void {
    event.preventDefault();
    event.stopPropagation();
    this.openMenu(col, event.clientX, event.clientY);
  }

  closeMenu(): void {
    this.columnMenu = null;
  }

  showFilterView(): void {
    if (!this.columnMenu?.col.filter) return;
    this.hydrateDraft(this.columnMenu.col);
    this.columnMenu = { ...this.columnMenu, view: 'filter' };
  }

  showActionsView(): void {
    if (!this.columnMenu) return;
    this.columnMenu = { ...this.columnMenu, view: 'actions' };
  }

  togglePin(col: NativeColumn): void {
    if (col.pinnable === false) return;
    if (this.pinOf(col)) {
      this.columnPins = { ...this.columnPins, [col.id]: null };
    } else {
      this.columnPins = { ...this.columnPins, [col.id]: autoPinSide(col, this.columns, this.columnWidths) };
    }
    this.pinsHydrated = true;
    this.persistPins();
    this.closeMenu();
    this.cdr.markForCheck();
  }

  applyFilter(): void {
    const col = this.columnMenu?.col;
    if (!col) return;
    const value = this.draftValue(col);
    const next: NativeFilters = { ...this.filters };
    if (!isFilterActive(value)) delete next[col.id];
    else next[col.id] = value;
    this.filtersChange.emit(next);
    this.closeMenu();
  }

  clearFilter(): void {
    const col = this.columnMenu?.col;
    if (!col) return;
    this.draftText = '';
    this.draftFrom = '';
    this.draftTo = '';
    this.draftSelect = '';
    this.draftMulti = [];
    if (!isFilterActive(this.filters[col.id])) return;
    const next: NativeFilters = { ...this.filters };
    delete next[col.id];
    this.filtersChange.emit(next);
    this.closeMenu();
  }

  toggleDraftMulti(value: string | number, checked: boolean): void {
    if (checked) this.draftMulti = [...this.draftMulti, value];
    else this.draftMulti = this.draftMulti.filter((item) => item !== value);
  }

  draftMultiHas(value: string | number): boolean {
    return this.draftMulti.some((item) => item === value);
  }

  goToPage(page: number): void {
    const viewport = this.viewport?.nativeElement;
    if (!viewport) return;
    const next = Math.min(this.pageTotal, Math.max(1, page));
    viewport.scrollTop = scrollTopForPage(next, this.pageSize, this.rowHeight, this.total, viewport.clientHeight);
  }

  onPageSize(value: string): void {
    const next = Number(value);
    if (!Number.isFinite(next) || next === this.pageSize) return;
    this.pageSizeChange.emit(next);
    this.scrollToStart();
  }

  onRowClick(event: MouseEvent, index: number): void {
    const target = event.target;
    if (target instanceof HTMLElement && target.closest('button, a, input, select, textarea, label')) return;
    this.rowNavActive = true;
    this.activateRow(index);
  }

  onCellEnter(event: MouseEvent, col: NativeColumn): void {
    if (col.tooltip === false || col.id === 'acciones') return;
    const cell = event.currentTarget;
    if (!(cell instanceof HTMLElement)) return;
    const textHost = cell.querySelector('.cell-text') ?? cell;
    if (!(textHost instanceof HTMLElement)) return;
    const text = textHost.innerText?.trim() ?? '';
    cell.title = textHost.scrollWidth > textHost.clientWidth + 1 ? text : '';
  }

  @HostListener('document:keydown', ['$event'])
  onDocumentKey(event: KeyboardEvent): void {
    if (event.key === 'Escape' && this.columnMenu) {
      event.preventDefault();
      this.closeMenu();
      this.cdr.markForCheck();
      return;
    }
    if (!this.keyboardNav || !this.rowNavActive || this.columnMenu) return;
    if (isTypingTarget(event.target, ['.col-menu'])) return;
    const delta = rowNavDelta(event);
    if (!delta) return;
    event.preventDefault();
    event.stopPropagation();
    const origin = this.selectedIndex < 0 ? (delta > 0 ? -1 : 0) : this.selectedIndex;
    const next = nextLoadedIndex(origin, delta, this.total, (index) => !isPlaceholder(this.rows[index]));
    this.activateRow(next);
  }

  @HostListener('document:pointerdown', ['$event'])
  onDocumentPointer(event: PointerEvent): void {
    const target = event.target;
    if (!(target instanceof Node)) return;
    if (!this.host.nativeElement.contains(target)) this.rowNavActive = false;
    if (!this.columnMenu) return;
    if (target instanceof HTMLElement && target.closest('.col-menu, .col-menu-btn')) return;
    this.closeMenu();
    this.cdr.markForCheck();
  }

  private activateRow(index: number): void {
    const row = this.rows[index];
    if (!row || isPlaceholder(row)) return;
    this.selectedIndexChange.emit(index);
    this.rowActivate.emit({ row, index });
    const viewport = this.viewport?.nativeElement;
    if (!viewport) return;
    const nextTop = scrollTopForRow(index, this.rowHeight, viewport.clientHeight, viewport.scrollTop);
    if (nextTop !== viewport.scrollTop) viewport.scrollTop = nextTop;
    this.cdr.markForCheck();
  }

  private openMenu(col: NativeColumn, x: number, y: number): void {
    const pad = 8;
    const left = Math.min(Math.max(pad, x), Math.max(pad, window.innerWidth - MENU_WIDTH - pad));
    const top = Math.min(Math.max(pad, y), Math.max(pad, window.innerHeight - 280 - pad));
    this.columnMenu = { col, x: left, y: top, view: 'actions' };
    this.cdr.markForCheck();
  }

  private hydrateDraft(col: NativeColumn): void {
    const value = this.filters[col.id];
    this.draftText = '';
    this.draftFrom = '';
    this.draftTo = '';
    this.draftSelect = '';
    this.draftMulti = [];
    const type = col.filter?.type;
    if (type === 'number' || type === 'date') {
      const range = parseRange(value);
      this.draftFrom = range.from;
      this.draftTo = range.to;
      return;
    }
    if (type === 'select') {
      this.draftSelect = value == null ? '' : String(value);
      return;
    }
    if (type === 'select-multi') {
      this.draftMulti = Array.isArray(value) ? [...value] : [];
      return;
    }
    this.draftText = value == null || Array.isArray(value) ? '' : String(value);
  }

  private draftValue(col: NativeColumn): FilterValue {
    const type = col.filter?.type ?? 'text';
    if (type === 'number' || type === 'date') {
      const from = this.draftFrom.trim();
      const to = this.draftTo.trim();
      if (!from && !to) return null;
      return `${from}..${to}`;
    }
    if (type === 'select') return this.draftSelect || null;
    if (type === 'select-multi') return this.draftMulti.length ? [...this.draftMulti] : null;
    const text = this.draftText.trim();
    return text ? text : null;
  }

  private syncVirtualRange(): void {
    const viewport = this.viewport?.nativeElement;
    const scrollTop = viewport?.scrollTop ?? 0;
    const viewportHeight = viewport?.clientHeight ?? 0;
    const range = visibleRange(scrollTop, viewportHeight, this.rowHeight, this.total);
    this.rangeStart = range.start;
    this.rangeEnd = range.end;
    this.offsetY = range.offsetY;
    const pages = pagesForRange(range.start, range.end, this.pageSize, this.total);
    const key = pages.join(',');
    if (key === this.lastPagesKey) return;
    this.lastPagesKey = key;
    this.visibleRangeChange.emit({ start: range.start, end: range.end, pages });
  }

  private alignPinnedColumns(): void {
    const viewport = this.viewport?.nativeElement;
    const head = this.head?.nativeElement;
    const headWrap = this.headWrap?.nativeElement;
    if (!viewport || !head || !headWrap) return;
    const scrollLeft = viewport.scrollLeft;
    const visibleWidth = viewport.clientWidth;
    if (visibleWidth !== this.viewportWidth) {
      this.viewportWidth = visibleWidth;
      this.layoutKey = '';
      this.cdr.markForCheck();
    }
    headWrap.style.paddingRight = `${viewport.offsetWidth - viewport.clientWidth}px`;
    head.style.transform = `translate3d(${-scrollLeft}px, 0, 0)`;

    const headers = new Map<string, HTMLElement>();
    for (const ref of this.headerCells ?? []) {
      const id = ref.nativeElement.dataset['col'];
      if (id) headers.set(id, ref.nativeElement);
    }

    let lastStuckLeft: string | null = null;
    let firstStuckRight: string | null = null;
    for (const col of this.columns) {
      const th = headers.get(col.id);
      if (!this.pinOf(col)) {
        if (th) th.style.transform = '';
        continue;
      }
      const width = this.widthOf(col);
      const start = this.columnStart(col);
      const visual = computePinVisual(
        start,
        width,
        scrollLeft,
        visibleWidth,
        this.insetLeft(col),
        this.insetRight(col),
      );
      if (th) th.style.transform = `translate3d(${scrollLeft + visual.visual - start}px, 0, 0)`;
      if (visual.stuckLeft) lastStuckLeft = col.id;
      if (visual.stuckRight && !firstStuckRight) firstStuckRight = col.id;
    }
    this.edgeLeftId = lastStuckLeft;
    this.edgeRightId = firstStuckRight;
  }

  private ensureWidths(): void {
    const next = { ...this.columnWidths };
    let changed = false;
    for (const col of this.columns) {
      if (next[col.id] == null) {
        next[col.id] = col.width ?? 120;
        changed = true;
      }
    }
    if (changed) this.columnWidths = next;
  }

  private restoreLayout(): void {
    this.ensureWidths();
    if (!this.storageKey) return;
    try {
      const widthsRaw = localStorage.getItem(this.widthsStorageKey());
      if (widthsRaw) {
        const saved = JSON.parse(widthsRaw) as Record<string, number>;
        const next = { ...this.columnWidths };
        for (const col of this.columns) {
          const width = saved[col.id];
          if (typeof width === 'number' && Number.isFinite(width)) {
            const min = col.minWidth ?? 56;
            const max = col.maxWidth ?? 640;
            next[col.id] = Math.min(max, Math.max(min, width));
          }
        }
        this.columnWidths = next;
        this.manualWidths = true;
      }
      const pinsRaw = localStorage.getItem(this.pinsStorageKey());
      if (pinsRaw) {
        const saved = JSON.parse(pinsRaw) as Record<string, Pin>;
        const next: Record<string, Pin | null> = {};
        for (const col of this.columns) {
          const pin = saved[col.id];
          next[col.id] = pin === 'left' || pin === 'right' ? pin : null;
        }
        this.columnPins = next;
        this.pinsHydrated = true;
      }
    } catch {
      this.pinsHydrated = false;
    }
  }

  private observeViewport(): void {
    const viewport = this.viewport?.nativeElement;
    if (!viewport || typeof ResizeObserver === 'undefined') return;
    this.resizeObserver = new ResizeObserver(() => {
      this.syncVirtualRange();
      this.alignPinnedColumns();
      this.cdr.markForCheck();
    });
    this.resizeObserver.observe(viewport);
  }

  private preferredWidth(col: NativeColumn): number {
    return columnWidth(col, this.columnWidths);
  }

  private layoutWidths(): Map<string, number> {
    const items = this.columns.map((col) => {
      const width = this.preferredWidth(col);
      return {
        id: col.id,
        width,
        min: Math.min(width, col.minWidth ?? 56),
        fixed: col.id === 'index' || col.id === 'acciones',
      };
    });
    const key = `${this.manualWidths ? 'manual' : this.viewportWidth}:${items.map((item) => item.width).join(',')}`;
    if (key === this.layoutKey) return this.layoutCache;
    this.layoutKey = key;
    const map = new Map<string, number>();
    const sum = items.reduce((total, item) => total + item.width, 0);
    const available = this.viewportWidth;
    if (this.manualWidths) {
      for (const item of items) map.set(item.id, item.width);
      this.layoutCache = map;
      return map;
    }
    if (available <= 0 || sum <= 0 || sum === available) {
      for (const item of items) map.set(item.id, item.width);
      this.layoutCache = map;
      return map;
    }
    if (sum < available) {
      const extra = available - sum;
      const flex = items.filter((item) => !item.fixed);
      const base = flex.reduce((total, item) => total + item.width, 0) || 1;
      let assigned = 0;
      for (const item of items) {
        if (item.fixed) {
          map.set(item.id, item.width);
          continue;
        }
        const add = Math.floor((extra * item.width) / base);
        assigned += add;
        map.set(item.id, item.width + add);
      }
      const last = flex[flex.length - 1];
      if (last) map.set(last.id, (map.get(last.id) ?? last.width) + (extra - assigned));
      this.layoutCache = map;
      return map;
    }
    const widths = items.map((item) => item.width);
    const minSum = items.reduce((total, item) => total + item.min, 0);
    const fixedSum = items.filter((item) => item.fixed).reduce((total, item) => total + item.width, 0);
    const flexItems = items.filter((item) => !item.fixed);
    const flexMin = flexItems.reduce((total, item) => total + item.min, 0);
    const targetFlex = available - fixedSum;
    if (targetFlex >= flexMin) {
      const flexSum = flexItems.reduce((total, item) => total + item.width, 0);
      let remaining = flexSum - targetFlex;
      const slack = flexSum - flexMin;
      const widths = new Map(items.map((item) => [item.id, item.fixed ? item.width : item.width]));
      for (let index = 0; index < flexItems.length && remaining > 0; index += 1) {
        const item = flexItems[index];
        const current = widths.get(item.id) ?? item.width;
        const room = current - item.min;
        const share = index === flexItems.length - 1 ? remaining : Math.round((remaining * room) / slack);
        const cut = Math.min(room, Math.max(0, share));
        widths.set(item.id, current - cut);
        remaining -= cut;
      }
      for (let index = flexItems.length - 1; index >= 0 && remaining > 0; index -= 1) {
        const item = flexItems[index];
        const current = widths.get(item.id) ?? item.width;
        const room = current - item.min;
        const cut = Math.min(room, remaining);
        widths.set(item.id, current - cut);
        remaining -= cut;
      }
      for (const item of items) map.set(item.id, widths.get(item.id) ?? item.width);
      this.layoutCache = map;
      return map;
    }
    if (minSum >= available) {
      items.forEach((item, index) => map.set(item.id, widths[index] = item.min));
      this.layoutCache = map;
      return map;
    }
    let remaining = sum - available;
    const slack = sum - minSum;
    for (let index = 0; index < items.length && remaining > 0; index += 1) {
      const room = widths[index] - items[index].min;
      const share = index === items.length - 1 ? remaining : Math.round((remaining * room) / slack);
      const cut = Math.min(room, Math.max(0, share));
      widths[index] -= cut;
      remaining -= cut;
    }
    for (let index = items.length - 1; index >= 0 && remaining > 0; index -= 1) {
      const room = widths[index] - items[index].min;
      const cut = Math.min(room, remaining);
      widths[index] -= cut;
      remaining -= cut;
    }
    items.forEach((item, index) => map.set(item.id, widths[index]));
    this.layoutCache = map;
    return map;
  }

  private persistWidths(): void {
    if (!this.storageKey) return;
    const payload: Record<string, number> = {};
    for (const col of this.columns) payload[col.id] = this.preferredWidth(col);
    localStorage.setItem(this.widthsStorageKey(), JSON.stringify(payload));
  }

  private persistPins(): void {
    if (!this.storageKey) return;
    const payload: Record<string, Pin> = {};
    for (const col of this.columns) {
      const pin = this.pinOf(col);
      if (pin) payload[col.id] = pin;
    }
    localStorage.setItem(this.pinsStorageKey(), JSON.stringify(payload));
  }

  private widthsStorageKey(): string {
    return `tc-native-table:${this.storageKey}`;
  }

  private pinsStorageKey(): string {
    return `tc-native-table-pins:${this.storageKey}`;
  }

  private detachResizeListeners(): void {
    if (this.resizeMove) document.removeEventListener('pointermove', this.resizeMove);
    if (this.resizeUp) document.removeEventListener('pointerup', this.resizeUp);
    this.resizeMove = undefined;
    this.resizeUp = undefined;
  }
}
