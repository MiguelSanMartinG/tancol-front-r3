import { Injectable, computed, inject, signal } from '@angular/core';
import { NavigationEnd, NavigationStart, Router } from '@angular/router';

/**
 * Estado de las peticiones en curso.
 *
 * - Lecturas (GET) al entrar a una pantalla → la pantalla muestra un esqueleto (skeleton) con su forma.
 * - Lecturas posteriores (paginar, buscar) → solo la barra delgada superior; las tablas pintan sus propios renglones esqueleto.
 * - Guardados (POST/PUT/PATCH/DELETE) → barra delgada y se bloquean los clics para evitar dobles envíos.
 */
@Injectable({ providedIn: 'root' })
export class LoadingService {
  private readonly router = inject(Router);

  readonly lecturas = signal(0);
  readonly escrituras = signal(0);
  /** Desde que inicia una navegación hasta que terminan sus primeras lecturas. */
  private readonly entrandoAPantalla = signal(false);
  private sinLecturasTimer: ReturnType<typeof setTimeout> | undefined;

  /** URL de la pantalla a la que se está entrando (para elegir la forma del esqueleto). */
  readonly destino = signal(this.router.url);

  /** Hay cualquier petición en curso (barra superior). */
  readonly loading = computed(() => this.lecturas() + this.escrituras() > 0);
  /** Esqueleto de pantalla completa: solo mientras carga la pantalla a la que se entró. */
  readonly skeletonPantalla = computed(() => this.entrandoAPantalla() && this.lecturas() > 0);
  /** Bloquear clics mientras se guarda. */
  readonly guardando = computed(() => this.escrituras() > 0);

  constructor() {
    this.router.events.subscribe((e) => {
      if (e instanceof NavigationStart) {
        clearTimeout(this.sinLecturasTimer);
        this.destino.set(e.url);
        this.entrandoAPantalla.set(true);
      }
      // Si la pantalla no pide datos, se deja de esperar.
      if (e instanceof NavigationEnd) this.programarFin(400);
    });
  }

  show(metodo = 'GET') {
    if (esLectura(metodo)) {
      clearTimeout(this.sinLecturasTimer);
      this.lecturas.update((n) => n + 1);
    } else {
      this.escrituras.update((n) => n + 1);
    }
  }

  hide(metodo = 'GET') {
    if (esLectura(metodo)) {
      this.lecturas.update((n) => Math.max(0, n - 1));
      // Pequeña espera por si una lectura encadena otra (catálogos y luego datos).
      if (this.lecturas() === 0) this.programarFin(150);
    } else {
      this.escrituras.update((n) => Math.max(0, n - 1));
    }
  }

  private programarFin(ms: number) {
    clearTimeout(this.sinLecturasTimer);
    this.sinLecturasTimer = setTimeout(() => {
      if (this.lecturas() === 0) this.entrandoAPantalla.set(false);
    }, ms);
  }
}

function esLectura(metodo: string) {
  const m = metodo.toUpperCase();
  return m === 'GET' || m === 'HEAD';
}
