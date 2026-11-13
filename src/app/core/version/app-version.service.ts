import { DestroyRef, Injectable, InjectionToken, inject } from '@angular/core';
import { environment } from '../../../environments/environment';

/**
 * Recarga silenciosa tras un deploy: las pestañas abiertas consultan assets/version.json
 * y se recargan solas cuando la versión publicada cambia. Sin banner.
 * Contrato: {"version":"<sha o build-id>"} (lo hornea scripts/write-version.mjs en la imagen).
 */

/** Solo en producción: en `ng serve` no se consulta version.json. */
export const APP_VERSION_POLLING = new InjectionToken<boolean>('APP_VERSION_POLLING', {
  providedIn: 'root',
  factory: () => environment.production === true,
});

export const APP_VERSION_POLL_MS = 60_000;

export function parseVersionPayload(data: unknown): string | null {
  if (typeof data !== 'object' || data === null) return null;
  const raw = (data as Record<string, unknown>)['version'];
  if (typeof raw !== 'string') return null;
  const trimmed = raw.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function shouldReloadForVersion(baseline: string | null, remote: string | null): boolean {
  return baseline != null && remote != null && baseline !== remote;
}

@Injectable({ providedIn: 'root' })
export class AppVersionService {
  private readonly enabled = inject(APP_VERSION_POLLING);
  private baseline: string | null = null;
  private started = false;
  private checking = false;
  private timer: ReturnType<typeof setInterval> | null = null;

  private readonly onVisibilityChange = () => {
    if (document.visibilityState === 'visible') void this.check();
  };

  constructor() {
    inject(DestroyRef).onDestroy(() => this.stop());
  }

  /** Idempotente. Se llama una vez desde provideAppInitializer. */
  start(): void {
    if (this.started || !this.enabled) return;
    this.started = true;
    void this.check();
    this.timer = setInterval(() => {
      if (document.visibilityState === 'hidden') return;
      void this.check();
    }, APP_VERSION_POLL_MS);
    document.addEventListener('visibilitychange', this.onVisibilityChange);
  }

  currentBaseline(): string | null {
    return this.baseline;
  }

  /** Consulta la versión publicada. Un check en curso no se solapa. */
  async check(): Promise<void> {
    if (this.checking) return;
    this.checking = true;
    try {
      const remote = await this.fetchRemote();
      if (remote == null) return; // fallo o payload inválido: no hay versión, no se toca el baseline
      if (this.baseline == null) {
        this.baseline = remote; // primer fetch exitoso: se guarda y no se recarga
        return;
      }
      if (shouldReloadForVersion(this.baseline, remote)) this.reload();
    } finally {
      this.checking = false;
    }
  }

  private async fetchRemote(): Promise<string | null> {
    try {
      // Relativo al <base href>; nunca /assets/version.json absoluto.
      const url = new URL('assets/version.json', document.baseURI).toString();
      const response = await fetch(url, { cache: 'no-store' });
      if (!response.ok) return null;
      return parseVersionPayload(await response.json());
    } catch {
      return null;
    }
  }

  private stop(): void {
    if (this.timer !== null) clearInterval(this.timer);
    this.timer = null;
    document.removeEventListener('visibilitychange', this.onVisibilityChange);
  }

  private reload(): void {
    location.reload();
  }
}
