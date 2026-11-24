import { Injectable, signal } from '@angular/core';

export type Tema = 'claro' | 'oscuro';

const CLAVE = 'tancol:tema';

/**
 * Modo claro / oscuro. Se guarda en este navegador; por defecto es el claro.
 * La clase `app-dark` en <html> activa el modo oscuro de PrimeNG y la paleta oscura de los estilos propios.
 */
@Injectable({ providedIn: 'root' })
export class TemaService {
  readonly tema = signal<Tema>(this.inicial());

  constructor() {
    this.aplicar(this.tema());
  }

  alternar() {
    const siguiente: Tema = this.tema() === 'oscuro' ? 'claro' : 'oscuro';
    this.tema.set(siguiente);
    this.aplicar(siguiente);
    try {
      localStorage.setItem(CLAVE, siguiente);
    } catch {
      // Sin almacenamiento: el tema dura solo esta visita.
    }
  }

  private inicial(): Tema {
    try {
      const guardado = localStorage.getItem(CLAVE);
      if (guardado === 'claro' || guardado === 'oscuro') return guardado;
    } catch {
      // Sin almacenamiento: modo claro.
    }
    return 'claro';
  }

  private aplicar(tema: Tema) {
    document.documentElement.classList.toggle('app-dark', tema === 'oscuro');
  }
}
