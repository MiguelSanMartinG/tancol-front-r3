import { Subscription } from 'rxjs';

/** Cancels stale page GETs when the visible page set changes. */
export class PageFetchController {
  private readonly inflight = new Map<number, Subscription>();

  track(page: number, sub: Subscription): void {
    this.inflight.get(page)?.unsubscribe();
    this.inflight.set(page, sub);
  }

  retain(keepPages: readonly number[]): void {
    const keep = new Set(keepPages);
    for (const [page, sub] of this.inflight) {
      if (!keep.has(page)) {
        sub.unsubscribe();
        this.inflight.delete(page);
      }
    }
  }

  cancelAll(): void {
    for (const sub of this.inflight.values()) {
      sub.unsubscribe();
    }
    this.inflight.clear();
  }
}
