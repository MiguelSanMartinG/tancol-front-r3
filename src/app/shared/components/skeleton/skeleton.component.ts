import { Component, computed, input } from '@angular/core';

/** Forma del esqueleto: una pantalla completa (lista, formulario, inicio) o un bloque dentro de la página. */
export type VarianteSkeleton = 'lista' | 'formulario' | 'inicio' | 'tablero' | 'bloque' | 'kpis';

/**
 * Esqueleto de carga (skeleton): imita la forma del contenido mientras llega la información,
 * en lugar de una pantalla o un spinner de «Cargando…».
 */
@Component({
  selector: 'app-skeleton',
  templateUrl: './skeleton.component.html',
  styleUrl: './skeleton.component.scss',
  host: { role: 'status', 'aria-live': 'polite', 'aria-busy': 'true', '[attr.aria-label]': 'etiqueta()' },
})
export class SkeletonComponent {
  readonly variante = input<VarianteSkeleton>('bloque');
  /** Renglones del bloque o de la tabla. */
  readonly filas = input(4);
  /** Tarjetas en la variante «kpis». */
  readonly tarjetas = input(4);
  readonly etiqueta = input('Cargando información');

  readonly listaFilas = computed(() => Array.from({ length: this.filas() }, (_, i) => i));
  readonly listaTarjetas = computed(() => Array.from({ length: this.tarjetas() }, (_, i) => i));
  /** Anchos variados para que el bloque parezca texto real. */
  readonly anchos = ['92%', '78%', '85%', '64%', '88%', '70%'];
  readonly campos = [0, 1, 2, 3, 4, 5, 6, 7];
  readonly columnas = [0, 1, 2, 3, 4, 5];
}
