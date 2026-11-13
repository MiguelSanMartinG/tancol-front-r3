import { DestroyRef, Injectable, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationError, Router } from '@angular/router';
import { filter } from 'rxjs';
import { DialogErrorService } from '@shared/components/error-modal/dialog-error.service';

/**
 * Entre un deploy y el siguiente poll de version.json, un click puede pedir un chunk que
 * ya no existe en el servidor. Se recarga UNA vez; si vuelve a fallar no hay segundo reload
 * automático: se muestra el aviso para recargar a mano. No mira version.json.
 */
export const CHUNK_RELOAD_KEY = 'tancol.chunkReload';
export const CHUNK_FLAG_CLEAR_MS = 10_000;

/** Aviso que pinta ErrorModalComponent cuando el reload automático ya no ayudó. */
export const NUEVA_VERSION_STATUS = 'NUEVA_VERSION';

const CHUNK_MESSAGES = [
  /Loading chunk [\w-]+ failed/i,
  /Failed to fetch dynamically imported module/i,
  /error loading dynamically imported module/i,
  /Importing a module script failed/i,
];

export function isChunkLoadError(error: unknown): boolean {
  if (!error) return false;
  const err = error as { name?: unknown; message?: unknown };
  if (err.name === 'ChunkLoadError') return true;
  const message = typeof err.message === 'string' ? err.message : typeof error === 'string' ? error : '';
  return CHUNK_MESSAGES.some((pattern) => pattern.test(message));
}

@Injectable({ providedIn: 'root' })
export class ChunkReloadService {
  private readonly router = inject(Router);
  private readonly dialogError = inject(DialogErrorService);
  private readonly destroyRef = inject(DestroyRef);
  private started = false;
  private clearTimer: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    this.destroyRef.onDestroy(() => {
      if (this.clearTimer !== null) clearTimeout(this.clearTimer);
    });
  }

  /** Idempotente. Se llama una vez desde provideAppInitializer. */
  start(): void {
    if (this.started) return;
    this.started = true;

    this.router.events
      .pipe(
        filter((event): event is NavigationError => event instanceof NavigationError),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((event) => this.handleError(event.error));

    // El boot terminó bien tras el reload automático: a los 10 s se olvida el intento.
    if (this.readFlag() === '1') {
      this.clearTimer = setTimeout(() => this.clearFlag(), CHUNK_FLAG_CLEAR_MS);
    }
  }

  /** Devuelve true si el error era de chunk (y ya se atendió). */
  handleError(error: unknown): boolean {
    if (!isChunkLoadError(error)) return false;
    if (this.readFlag() !== '1') {
      this.writeFlag();
      this.reload();
      return true;
    }
    // Segundo fallo seguido: no hay otro reload automático.
    this.clearFlag();
    this.dialogError.dataError.set({ status: NUEVA_VERSION_STATUS });
    this.dialogError.request = null;
    this.dialogError.display.set(true);
    return true;
  }

  private readFlag(): string | null {
    try {
      return sessionStorage.getItem(CHUNK_RELOAD_KEY);
    } catch {
      return null;
    }
  }

  private writeFlag(): void {
    try {
      sessionStorage.setItem(CHUNK_RELOAD_KEY, '1');
    } catch {}
  }

  private clearFlag(): void {
    try {
      sessionStorage.removeItem(CHUNK_RELOAD_KEY);
    } catch {}
  }

  private reload(): void {
    location.reload();
  }
}
