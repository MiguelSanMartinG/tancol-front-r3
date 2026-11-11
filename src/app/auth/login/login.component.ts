import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AppPrimengModule } from '@shared/app-primeng/app-primeng.module';
import { AuthDTO, AuthService } from './service/auth.service';
import { CommonModule } from '@angular/common';
import { LocalStorageService } from '@shared/services/local-storage.service';
import { EmpleadoApiService } from '@app/dashboard/modules/empleados/services/empleado.api.service';
import { ProfileApiService, ProfileResponse } from '@app/dashboard/modules/rol/services/profile.api.service';
import { DialogErrorService } from '@shared/components/error-modal/dialog-error.service';
import { MessageService } from 'primeng/api';
import { environment } from '../../../environments/environment';
@Component({
  selector: 'app-login',
  imports: [
    CommonModule,
    AppPrimengModule,
    ReactiveFormsModule
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent implements OnInit {
  router = inject(Router);
  fb = inject(FormBuilder);
  authService = inject(AuthService);
  empleadoApi = inject(EmpleadoApiService);
  profileApi = inject(ProfileApiService);
  dialogError = inject(DialogErrorService);
  messageService = inject(MessageService);

  private readonly isLocalhost = ['localhost', '127.0.0.1', '::1'].includes(globalThis.location?.hostname ?? '');

  loginForm: FormGroup = this.fb.group({
    usuario: [environment.loginDefaults.usuario, [Validators.required]],
    contrasena: [this.isLocalhost ? environment.loginDefaults.contrasena : '', Validators.required]
  });

  localStrogae = inject(LocalStorageService);

  ngOnInit(): void {
    const reason = this.localStrogae.getLogoutReason();
    if (reason === 'SESSION_EXPIRED') {
      this.messageService.add({
        key: 'top-right',
        severity: 'warn',
        summary: 'Sesión expirada',
        detail: 'Vuelve a iniciar sesión.',
        life: 5000,
      });
      this.localStrogae.clearLogoutReason();
    }
  }

  submit() {
          // this.router.navigateByUrl('/dashboard');

    if (this.loginForm.valid) {
      const request:AuthDTO = {
        contrasena: this.loginForm.get('contrasena')?.value,
        nombreUsuario: this.loginForm.get('usuario')?.value
      }
      this.authService.auth(request).subscribe((resp) => {
        console.log(resp);
        this.localStrogae.setToken(resp.token);
        this.localStrogae.setUserInfo(resp);

        // Encadenar carga de empleado y permisos
        const idEmpleado = resp.idEmpleado;
        if (idEmpleado) {
          this.empleadoApi.getOne(idEmpleado).subscribe({
            next: (empleado) => {
              const roleId = (empleado as any)?.role?.id;
              if (roleId != null) {
                this.profileApi.getByRole(roleId).subscribe({
                  next: (profiles: ProfileResponse[]) => {
                    const allowed = new Set<string>();
                    profiles.forEach((p) => {
                      const any = p.canRead || p.canWrite || p.canDelete || p.canUpdate;
                      const parentName = p.module?.parent?.name as string | undefined;
                      if (any && parentName) allowed.add(parentName);
                    });
                    this.localStrogae.setProfiles(profiles);
                    this.localStrogae.setAllowedParents(Array.from(allowed));
                    this.router.navigateByUrl('/dashboard');
                  },
                  error: () => {
                    this.router.navigateByUrl('/dashboard');
                  },
                });
              } else {
                // Sin rol: logout y regresar a login sin mostrar modal
                this.localStrogae.logout();
                this.router.navigateByUrl('/login');
              }
            },
            error: () => {
              this.router.navigateByUrl('/dashboard');
            },
          });
        } else {
          // Sin idEmpleado: logout y mensaje
          this.localStrogae.logout();
          this.router.navigateByUrl('/login');
        }
      });

    } else {
      this.loginForm.markAllAsTouched();
    }
  }
}


