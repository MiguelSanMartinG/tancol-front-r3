import { Component, ElementRef, OnInit, inject, signal, viewChild } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AppPrimengModule } from '@shared/app-primeng/app-primeng.module';
import { AuthDTO, AuthResponse, AuthService } from './service/auth.service';
import { CommonModule } from '@angular/common';
import { LocalStorageService } from '@shared/services/local-storage.service';
import { EmpleadoApiService } from '@app/dashboard/modules/empleados/services/empleado.api.service';
import { ProfileApiService, ProfileResponse } from '@app/dashboard/modules/rol/services/profile.api.service';
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
  messageService = inject(MessageService);
  authError = signal<string | null>(null);
  private contrasenaInput = viewChild<ElementRef<HTMLInputElement>>('contrasenaInput');

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
      this.authError.set(null);
      this.authService.auth(request).subscribe({
        next: (resp) => { this.onAuthSuccess(resp); },
        error: (err) => { this.onAuthError(err); },
      });
    } else {
      this.loginForm.markAllAsTouched();
    }
  }

  clearAuthError(): void {
    if (this.authError()) this.authError.set(null);
  }

  private onAuthError(err: { status?: number; error?: { message?: string } | string }): void {
    const status = Number(err?.status ?? 0);
    if (status < 400 || status >= 500) return;

    const body = err?.error;
    const raw = typeof body === 'string' ? body : body?.message;
    const message = raw?.trim();
    this.authError.set(
      message
        ? (/[.!?]$/.test(message) ? message : `${message}.`)
        : 'Revisa el usuario y la contraseña.'
    );

    queueMicrotask(() => {
      const input = this.contrasenaInput()?.nativeElement;
      input?.focus();
      input?.select();
    });
  }

  private onAuthSuccess(resp: AuthResponse): void {
    console.log(resp);
    this.localStrogae.setToken(resp.token);
    this.localStrogae.setUserInfo(resp);

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
            this.localStrogae.logout();
            this.router.navigateByUrl('/login');
          }
        },
        error: () => {
          this.router.navigateByUrl('/dashboard');
        },
      });
    } else {
      this.localStrogae.logout();
      this.router.navigateByUrl('/login');
    }
  }
}


