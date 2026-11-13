import { Component, DestroyRef, HostListener, computed, inject } from '@angular/core';
import { DialogErrorService } from './dialog-error.service';
import { animate, style, transition, trigger } from '@angular/animations';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

const reduceMotion =
  typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;

interface ErrorNotice {
  message: string;
  detail: string | null;
  code: string | null;
  retry: boolean;
  retryLabel: string;
}

function asSentence(text: string): string {
  const trimmed = text.trim();
  return /[.!?]$/.test(trimmed) ? trimmed : `${trimmed}.`;
}

function buildNotice(data: any): ErrorNotice {
  const statusRaw = data?.status;

  // Se publicó una versión nueva y el reload automático no bastó (ChunkReloadService).
  if (statusRaw === 'NUEVA_VERSION') {
    return {
      message: 'Hay una versión nueva del sistema.',
      detail: 'Recarga la página para continuar.',
      code: null,
      retry: true,
      retryLabel: 'Recargar',
    };
  }

  const statusNum = Number(statusRaw);
  const knownStatus = Number.isFinite(statusNum);
  const body = data?.error;
  const raw =
    (typeof body === 'string' ? body : null) ??
    (typeof body?.message === 'string' ? body.message : null) ??
    (typeof data?.message === 'string' ? data.message : null) ??
    '';

  const cleaned = raw.trim();
  const isHttpDump = cleaned.startsWith('Http failure response');
  let message = !cleaned || isHttpDump ? '' : cleaned;

  if (statusRaw === 'SESSION_EXPIRED') {
    message = 'La sesión expiró. Vuelve a iniciar sesión.';
  } else if (!message && knownStatus && statusNum === 0) {
    message = 'No se pudo conectar con el servidor.';
  } else if (!message) {
    message = 'No se pudo completar la acción.';
  } else {
    message = asSentence(message);
  }

  const offline = knownStatus && statusNum === 0;
  const serverFault = knownStatus && statusNum >= 500;

  return {
    message,
    detail: offline
      ? 'Revisa la conexión y vuelve a intentarlo.'
      : serverFault
        ? 'Si vuelve a pasar, avisa al administrador.'
        : null,
    code: offline || serverFault ? String(statusRaw) : null,
    retry: offline,
    retryLabel: 'Reintentar',
  };
}

@Component({
  selector: 'app-error-modal',
  templateUrl: './error-modal.component.html',
  styleUrls: ['./error-modal.component.scss'],
  animations: [
    trigger('fadeInOut', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate(reduceMotion ? '0ms' : '160ms ease-out', style({ opacity: 1 })),
      ]),
      transition(':leave', [
        animate(reduceMotion ? '0ms' : '120ms ease-in', style({ opacity: 0 })),
      ]),
    ]),
  ],
})
export class ErrorModalComponent {
  dialogError = inject(DialogErrorService);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);

  notice = computed(() => buildNotice(this.dialogError.dataError()));

  constructor() {
    this.router.events
      .pipe(
        filter((event) => event instanceof NavigationEnd),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => this.dialogError.display.set(false));
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.dialogError.display()) this.close();
  }

  close(): void {
    this.dialogError.display.set(false);
  }

  handleRetry(): void {
    this.close();
    window.location.reload();
  }
}
