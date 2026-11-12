import { CommonModule } from '@angular/common';
import { Component, DestroyRef, computed, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { Notificacion, NotificacionesService } from '@app/core/services/notificaciones.service';
import { agruparNotificaciones } from './notificacion-vista';
import { LocalStorageService } from '@shared/services/local-storage.service';
import { DashboardShellService } from '../navigation/dashboard-shell.service';
import {
  FUNCIONALIDADES,
  Funcionalidad,
  GRUPOS,
  SECCIONES,
  SeccionNav,
  Tono,
  buscarFuncionalidad,
  rutasPermitidas,
  segmentoRuta,
} from '../navigation/funcionalidades.data';

@Component({
  selector: 'app-principal',
  imports: [CommonModule, RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './principal.component.html',
  styleUrl: './principal.component.scss',
})
export class PrincipalComponent implements OnInit {
  localStorage = inject(LocalStorageService);
  private notificacionesService = inject(NotificacionesService);
  private router = inject(Router);
  readonly shell = inject(DashboardShellService);

  notificaciones = this.notificacionesService.notificaciones;
  pendientes = this.notificacionesService.pendientes;
  noLeidas = this.notificacionesService.noLeidas;
  puedeVerNotificaciones = (this.localStorage.getProfiles() ?? []).some((profile) =>
    profile.module?.ruta?.split(/[?#]/)[0].split('/').filter(Boolean).at(-1) === 'notificaciones' && profile.canRead
  );
  readonly filtro = signal<'todas' | 'noleidas'>('noleidas');
  readonly grupos = computed(() =>
    agruparNotificaciones(this.filtro() === 'noleidas' ? this.pendientes() : this.notificaciones())
  );
  readonly avatarRoto = signal(false);
  readonly url = signal(this.router.url);
  readonly flyout = signal<FlyoutMenu | null>(null);
  private closeTimer: ReturnType<typeof setTimeout> | null = null;

  readonly secciones = computed(() => {
    this.shell.permisosListos();
    const allowed = this.localStorage.getAllowedParents();
    if (!allowed?.length) return SECCIONES;
    const visibles = SECCIONES.filter((seccion) => allowed.includes(seccion.parent));
    return visibles.length ? visibles : SECCIONES;
  });

  readonly menus = computed(() => {
    this.shell.permisosListos();
    const allowed = rutasPermitidas(this.localStorage.getProfiles() ?? []);
    const visible = (item: Funcionalidad) =>
      item.route === './configuracion-kpis' || allowed.has(segmentoRuta(item.route));

    return new Map(
      SECCIONES.map((seccion) => [
        seccion.key,
        GRUPOS.filter((grupo) => grupo.section === seccion.key)
          .map((grupo) => ({
            id: grupo.id,
            label: grupo.label,
            tone: grupo.tone,
            items: FUNCIONALIDADES.filter(
              (item) => item.group === grupo.id && item.section === seccion.key && visible(item)
            ).map((item) => ({
              label: item.label,
              icon: item.icon,
              tone: item.tone,
              href: `/dashboard/principal/${segmentoRuta(item.route)}`,
            })),
          }))
          .filter((grupo) => grupo.items.length > 0),
      ])
    );
  });

  readonly enInicio = computed(() => this.segmento() === null);
  readonly seccionActual = computed(() => {
    const item = this.funcionalidadActual();
    const key = item?.section ?? this.shell.section();
    return SECCIONES.find((seccion) => seccion.key === key) ?? SECCIONES[0];
  });

  constructor() {
    inject(DestroyRef).onDestroy(() => this.cancelarCierre());
    this.router.events
      .pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
        takeUntilDestroyed(inject(DestroyRef))
      )
      .subscribe((event) => {
        this.url.set(event.urlAfterRedirects);
        this.cerrarFlyout();
        if (!this.segmento()) return;
        this.shell.helpOpen.set(false);
        const item = this.funcionalidadActual();
        if (item && item.section !== this.shell.section()) {
          this.shell.fijarSeccion(item.section);
        }
      });
  }

  ngOnInit() {
    if (this.puedeVerNotificaciones) this.notificacionesService.cargar();
  }

  marcarComoLeida(notificacion: Notificacion) {
    this.notificacionesService.marcarComoLeida(notificacion);
  }

  marcarTodas() {
    this.notificacionesService.marcarTodasComoLeidas();
  }

  cerrarAvisos(panel: HTMLDetailsElement) {
    panel.open = false;
  }

  abrirFlyout(seccion: SeccionNav, event: Event) {
    if (window.innerWidth <= 960) return;
    const grupos = this.menus().get(seccion.key) ?? [];
    if (!grupos.length) return;
    this.cancelarCierre();
    const row = event.currentTarget as HTMLElement;
    const rowBox = row.getBoundingClientRect();
    const sidebar = row.closest('.sidebar')?.getBoundingClientRect();
    const alto = Math.min(window.innerHeight * 0.72, 560);
    let top = rowBox.top;
    if (top + alto > window.innerHeight - 8) top = Math.max(8, window.innerHeight - 8 - alto);
    this.flyout.set({
      key: seccion.key,
      label: seccion.label,
      top,
      left: (sidebar?.right ?? rowBox.right) - 16,
      grupos,
    });
  }

  programarCierre() {
    this.cancelarCierre();
    this.closeTimer = setTimeout(() => this.flyout.set(null), 200);
  }

  cancelarCierre() {
    if (this.closeTimer === null) return;
    clearTimeout(this.closeTimer);
    this.closeTimer = null;
  }

  cerrarFlyout() {
    this.cancelarCierre();
    this.flyout.set(null);
  }

  rutaAbierta(href: string): boolean {
    const path = this.url().split('?')[0].replace(/\/$/, '');
    return path === href || path.startsWith(`${href}/`);
  }

  elegirSeccion(key: number) {
    this.cerrarFlyout();
    this.shell.fijarSeccion(key);
    this.shell.helpOpen.set(false);
    this.shell.mobileOpen.set(false);
    if (!this.enInicio()) this.router.navigateByUrl('/dashboard/principal');
  }

  abrirAyuda() {
    this.shell.helpOpen.set(true);
    this.shell.mobileOpen.set(false);
    if (!this.enInicio()) this.router.navigateByUrl('/dashboard/principal');
  }

  seccionActiva(key: number): boolean {
    if (this.shell.helpOpen() && this.enInicio()) return false;
    return this.seccionActual().key === key;
  }

  cerrarSesion() {
    this.localStorage.logout();
    this.router.navigateByUrl('/login');
  }

  nombreUsuario(): string {
    return this.localStorage.getUserInfo()?.nombre || 'Usuario';
  }

  nombreVisible(): string {
    const nombre = this.nombreUsuario().trim();
    if (/^admin$/i.test(nombre)) return 'Administrador';
    return nombre;
  }

  rolVisible(): string {
    this.shell.permisosListos();
    const rol = this.localStorage.getProfiles()?.[0]?.role?.name?.trim() || '';
    if (!rol || /^admin/i.test(rol)) return 'Administrador del sistema';
    return rol;
  }

  iniciales(): string {
    const partes = this.nombreUsuario().trim().split(/\s+/).filter(Boolean);
    const letras = partes.slice(0, 2).map((parte) => parte[0]?.toUpperCase() ?? '');
    return letras.join('') || 'T';
  }

  paginaActual(): string | null {
    return this.funcionalidadActual()?.label ?? null;
  }

  private segmento(): string | null {
    const path = this.url().split('?')[0].replace(/\/$/, '');
    const prefix = '/dashboard/principal';
    if (path === prefix || path === '') return null;
    if (!path.startsWith(`${prefix}/`)) return null;
    return path.slice(prefix.length + 1).split('/')[0] || null;
  }

  private funcionalidadActual() {
    const segmento = this.segmento();
    return segmento ? buscarFuncionalidad(segmento) : undefined;
  }
}

interface FlyoutItem {
  label: string;
  icon: string;
  tone: Tono;
  href: string;
}

interface FlyoutMenu {
  key: number;
  label: string;
  top: number;
  left: number;
  grupos: { id: string; label: string; tone: Tono; items: FlyoutItem[] }[];
}
