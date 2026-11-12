// auth.interceptor.ts
import { HttpInterceptorFn, HttpContextToken } from '@angular/common/http';
import { catchError, finalize, throwError } from 'rxjs';
import { environment } from '../../environments/environment';
import { inject } from '@angular/core';
import { LoadingService } from '@shared/components/loading/loading-service.service';
import { DialogErrorService } from '@shared/components/error-modal/dialog-error.service';
import { Router } from '@angular/router';
import { LocalStorageService } from '@shared/services/local-storage.service';

export const SKIP_LOADING = new HttpContextToken<boolean>(() => false);

const ABS_RE = /^https?:\/\//i;
const I18N_RE = /(^|\/)(assets\/)?i18n\/[^/]+\.json(\?.*)?$/i;
const AUTH_RE = /\/auth\/(login|signin|register|refresh|forgot|reset)(\/|$)/i;

function isAbsolute(url: string) { return ABS_RE.test(url); }
function isI18n(url: string) { return I18N_RE.test(url); }
function isAuth(url: string) { return AUTH_RE.test(url); }
function joinBase(base: string, path: string) {
  const b = base.replace(/\/+$/, '');
  const p = path.replace(/^\/+/, '');
  return `${b}/${p}`;
}

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const loading = inject(LoadingService);
  const dialogError = inject(DialogErrorService);
  const router = inject(Router);
  const ls = inject(LocalStorageService);

  const skip = req.context.get(SKIP_LOADING);

  // 1) Resolver URL final: solo prefijar si es relativa y no es i18n
  let url = req.url;
  if (!isAbsolute(url) && !isI18n(url)) {
    url = joinBase(environment.apiUrl, url);
  }

  // 2) Headers: NO meter Authorization a endpoints de auth
  let headers = req.headers;
  const token = localStorage.getItem('token');
  if (token && !isAuth(url)) {
    headers = headers.set('Authorization', `Bearer ${token}`);
  }
  // Fuerza JSON solo si no viene ya (opcional)
  const isFormDataBody = typeof FormData !== 'undefined' && req.body instanceof FormData;
  const isBlobBody = typeof Blob !== 'undefined' && req.body instanceof Blob;

  if (!headers.has('Content-Type') && req.body != null && !isFormDataBody && !isBlobBody) {
    // Default to JSON unless the body needs the browser to set headers (e.g., FormData uploads)
    headers = headers.set('Content-Type', 'application/json');
  }

  const cloned = req.clone({ url, headers });

  if (!skip) loading.show();

  return next(cloned).pipe(
    catchError((error) => {
      const status = Number(error?.status ?? 0);

      if (status === 401 && !isAuth(url)) {
        try { ls.setLogoutReason('SESSION_EXPIRED'); } catch {}
        try { ls.logout(); } catch {}
        router.navigateByUrl('/login');
        return throwError(() => error);
      }

      // Un dato mal escrito en el login se muestra en el formulario.
      const authMistake = isAuth(url) && status >= 400 && status < 500;
      if (!isI18n(req.url) && !authMistake && !dialogError.display()) {
        dialogError.dataError.set(error);
        dialogError.request = req.clone();
        dialogError.display.set(true);
      }
      return throwError(() => error);
    }),
    finalize(() => { if (!skip) loading.hide(); })
  );
};


