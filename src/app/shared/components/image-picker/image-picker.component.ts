import { Component, DestroyRef, computed, inject, input, output, signal } from '@angular/core';

/**
 * Selector de imagen con el mismo diseño que «Nuevo insumo»: zona grande para
 * arrastrar o elegir la imagen, vista previa, tamaño y opciones para cambiarla o quitarla.
 * Solo entrega el `File`; la subida sigue a cargo del formulario.
 */
@Component({
  selector: 'app-image-picker',
  templateUrl: './image-picker.component.html',
  styleUrl: './image-picker.component.scss',
})
export class ImagePickerComponent {
  readonly accept = input('image/png,image/jpeg');
  readonly hint = input('PNG o JPG · Máximo 5 MB');
  readonly maxSizeMb = input(5);
  /** URL de la imagen ya guardada (en edición). */
  readonly existingUrl = input<string | null>(null);

  readonly fileChange = output<File | null>();
  readonly existingRemoved = output<void>();

  readonly archivo = signal<File | null>(null);
  readonly vistaPrevia = signal<string | null>(null);
  readonly error = signal<string | null>(null);
  readonly arrastrando = signal(false);
  private readonly existenteQuitada = signal(false);

  readonly imagen = computed(() => this.vistaPrevia() ?? (this.existenteQuitada() ? null : this.existingUrl()));

  constructor() {
    inject(DestroyRef).onDestroy(() => this.liberar());
  }

  alSeleccionar(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (file) this.cargar(file);
  }

  alArrastrar(event: DragEvent, dentro: boolean) {
    event.preventDefault();
    this.arrastrando.set(dentro);
  }

  alSoltar(event: DragEvent) {
    event.preventDefault();
    this.arrastrando.set(false);
    const file = event.dataTransfer?.files?.[0];
    if (file) this.cargar(file);
  }

  quitar() {
    if (this.archivo()) {
      this.liberar();
      this.archivo.set(null);
      this.fileChange.emit(null);
      return;
    }
    this.existenteQuitada.set(true);
    this.existingRemoved.emit();
  }

  tamano(bytes: number): string {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  }

  private cargar(file: File) {
    this.error.set(null);
    const tipos = this.accept().split(',').map((t) => t.trim());
    const valido = tipos.some((t) => (t.endsWith('/*') ? file.type.startsWith(t.slice(0, -1)) : file.type === t));
    if (!valido) {
      this.error.set(`Formato no permitido. ${this.hint()}.`);
      return;
    }
    if (file.size > this.maxSizeMb() * 1024 * 1024) {
      this.error.set(`La imagen pesa ${this.tamano(file.size)}; el máximo es ${this.maxSizeMb()} MB.`);
      return;
    }
    this.liberar();
    this.archivo.set(file);
    this.vistaPrevia.set(URL.createObjectURL(file));
    this.fileChange.emit(file);
  }

  private liberar() {
    const url = this.vistaPrevia();
    if (url) URL.revokeObjectURL(url);
    this.vistaPrevia.set(null);
  }
}
