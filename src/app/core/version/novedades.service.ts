import { Injectable, computed, signal } from '@angular/core';
import { CHANGELOG, Novedad, VERSION_ACTUAL } from './changelog';

const PREFIJO = 'tancol:novedades-vistas:';

/**
 * Decide si al usuario le toca ver las novedades de la versión actual.
 * Se recuerda por usuario (en este navegador) la última versión que ya vio.
 */
@Injectable({ providedIn: 'root' })
export class NovedadesService {
  readonly version = VERSION_ACTUAL;
  readonly actual: Novedad = CHANGELOG[0];
  readonly visible = signal(false);
  /** Si el almacenamiento no está disponible, se muestra una sola vez por carga. */
  private vistaEnMemoria = false;

  readonly fechaLegible = computed(() => {
    const [a, m, d] = this.actual.fecha.split('-').map(Number);
    return new Date(a, m - 1, d).toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' });
  });

  /** Muestra las novedades si el usuario aún no ha visto esta versión. */
  mostrarSiCorresponde(): void {
    if (!this.yaVista()) this.visible.set(true);
  }

  abrir(): void {
    this.visible.set(true);
  }

  cerrar(): void {
    this.visible.set(false);
    this.vistaEnMemoria = true;
    try {
      localStorage.setItem(this.clave(), this.version);
    } catch {
      // Sin almacenamiento: basta con no repetirlo en esta carga.
    }
  }

  private yaVista(): boolean {
    if (this.vistaEnMemoria) return true;
    try {
      return localStorage.getItem(this.clave()) === this.version;
    } catch {
      return false;
    }
  }

  private clave(): string {
    let usuario = 'anonimo';
    try {
      const info = JSON.parse(localStorage.getItem('userInfo') ?? 'null');
      usuario = info?.idEmpleado || info?.nombreUsuario || usuario;
    } catch {
      // userInfo ausente o ilegible: se usa la clave genérica.
    }
    return PREFIJO + usuario;
  }
}
