import { inject } from '@angular/core';
import { CanActivateChildFn, CanMatchFn, Router } from '@angular/router';
import { LocalStorageService } from '@shared/services/local-storage.service';

export const authGuard: CanMatchFn = () => {
  const ls = inject(LocalStorageService);
  const router = inject(Router);
  const token = ls.getToken();
  if (token) return true;
  router.navigateByUrl('/login');
  return false;
};

export const permissionGuard: CanActivateChildFn = (_route, state) => {
  const router = inject(Router);
  const ls = inject(LocalStorageService);

  const profiles = ls.getProfiles() ?? [];
  const normalizeRoute = (route: string) => route.split(/[?#]/)[0].split('/').filter(Boolean).at(-1) ?? '';
  const allowedRoutes = new Set(
    profiles
      .filter((p: any) => {
        if (!p) return false;
        const route = p.module?.ruta?.split(/[?#]/)[0].split('/').filter(Boolean).at(-1);
        return route === 'notificaciones' ? p.canRead : (p.canRead || p.canWrite || p.canDelete || p.canUpdate);
      })
      .map((p: any) => p.module?.ruta)
      .filter((r: any): r is string => !!r)
      .map(normalizeRoute)
  );

  const url = state.url || '';
  const clean = url.split('?')[0].split('#')[0];
  const segments = clean.split('/').filter(Boolean);
  // Find the segment directly after 'principal'
  const idx = segments.indexOf('principal');
  const moduleSeg = idx >= 0 && segments.length > idx + 1 ? segments[idx + 1] : segments[segments.length - 1] || '';

  // Allow navigating to principal itself
  if (moduleSeg === 'principal' || moduleSeg === '' || moduleSeg === 'dashboard-reportes' || moduleSeg === 'configuracion-kpis') return true;

  if (allowedRoutes.has(normalizeRoute(moduleSeg))) return true;

  router.navigateByUrl('/dashboard/principal');
  return false;
};

