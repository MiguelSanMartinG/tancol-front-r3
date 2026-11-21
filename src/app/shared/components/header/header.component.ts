import { Component, computed, input } from '@angular/core';

/** Acciones de formulario que se muestran como tag junto al título («Equipo · Crear»). */
const ACCIONES = ['Crear', 'Editar', 'Detalle', 'Facturar', 'Permisos'];
const PATRON_ACCION = new RegExp(`^(.+?)\\s*[-–]\\s*(${ACCIONES.join('|')})$`, 'i');

@Component({
  selector: 'app-header',
  imports: [],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss'
})
export class HeaderComponent {
  label = input.required<string>();
  /** Acción explícita; si no se pasa, se toma del sufijo del label («Equipo - Crear»). */
  action = input<string | null>(null);

  private readonly partes = computed(() => {
    const texto = String(this.label() ?? '').trim();
    const explicita = this.action();
    if (explicita) return { titulo: texto, accion: explicita };
    const m = texto.match(PATRON_ACCION);
    if (!m) return { titulo: texto, accion: null };
    const accion = ACCIONES.find((a) => a.toLowerCase() === m[2].toLowerCase()) ?? m[2];
    return { titulo: m[1].trim(), accion };
  });

  readonly titulo = computed(() => this.partes().titulo);
  readonly accion = computed(() => this.partes().accion);
}
