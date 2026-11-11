import { Injectable, inject } from '@angular/core';
import { LocalStorageService } from '@shared/services/local-storage.service';
import { EmpleadoApiService } from '@app/dashboard/modules/empleados/services/empleado.api.service';
import { ProfileApiService, ProfileResponse } from '@app/dashboard/modules/rol/services/profile.api.service';
import { DialogErrorService } from '@shared/components/error-modal/dialog-error.service';
import { Router } from '@angular/router';
import { EMPTY, Observable, catchError, of, switchMap, tap, map } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class PermissionsService {
  private ls = inject(LocalStorageService);
  private empleadoApi = inject(EmpleadoApiService);
  private profileApi = inject(ProfileApiService);
  private dialogError = inject(DialogErrorService);
  private router = inject(Router);

  refreshOnStartup(): Observable<void> {
    const token = this.ls.getToken();
    const userInfo = this.ls.getUserInfo();
    if (!token || !userInfo?.idEmpleado) {
      return of(void 0);
    }

    const idEmpleado = userInfo.idEmpleado;

    return this.empleadoApi.getOne(idEmpleado).pipe(
      switchMap((empleado: any) => {
        const roleId = empleado?.role?.id;
        if (roleId == null) {
          // Sin rol: logout y navegar a login sin mostrar modal
          this.ls.logout();
          this.router.navigateByUrl('/login');
          return of(void 0);
        }
        return this.profileApi.getByRole(roleId).pipe(
          tap((profiles: ProfileResponse[]) => {
            const allowed = new Set<string>();
            profiles.forEach((p) => {
              const any = p.canRead || p.canWrite || p.canDelete || p.canUpdate;
              const parentName = (p as any)?.module?.parent?.name as string | undefined;
              if (any && parentName) allowed.add(parentName);
            });
            this.ls.setProfiles(profiles);
            this.ls.setAllowedParents(Array.from(allowed));
          }),
          map(() => void 0)
        );
      }),
      catchError(() => of(void 0))
    );
  }
}
