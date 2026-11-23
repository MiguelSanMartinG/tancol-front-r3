import { Component, DestroyRef, computed, inject, input, output, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { TooltipModule } from 'primeng/tooltip';

/**
 * Campo para adjuntar un archivo: arrastrar y soltar o clic para elegir,
 * con barra de carga, tamaño y opciones para guardar (descargar) o eliminar.
 *
 * El componente solo entrega el `File`; la subida al servidor sigue a cargo del formulario.
 */
@Component({
  selector: 'app-file-drop',
  imports: [TooltipModule],
  templateUrl: './file-drop.component.html',
  styleUrl: './file-drop.component.scss',
})
export class FileDropComponent {
  /** Tipos aceptados, como en `<input accept>`: `image/*`, `.pdf`… */
  readonly accept = input('*/*');
  /** Texto de ayuda con los formatos, p. ej. «PNG o JPG». */
  readonly acceptLabel = input('');
  readonly maxSizeMb = input(10);
  readonly disabled = input(false);
  /** Archivo ya guardado (en edición): nombre y URL para verlo o descargarlo. */
  readonly existingName = input<string | null>(null);
  readonly existingUrl = input<string | null>(null);

  /** Archivo elegido, o `null` cuando el usuario lo elimina. */
  readonly fileChange = output<File | null>();
  /** El usuario quitó el archivo que ya estaba guardado. */
  readonly existingRemoved = output<void>();

  readonly archivo = signal<File | null>(null);
  readonly progreso = signal(0);
  readonly cargando = signal(false);
  readonly arrastrando = signal(false);
  readonly error = signal<string | null>(null);
  readonly vistaPrevia = signal<string | null>(null);
  private existenteQuitado = signal(false);

  readonly mostrarExistente = computed(() => !this.archivo() && !!this.existingName() && !this.existenteQuitado());
  readonly ayuda = computed(() => {
    const formatos = this.acceptLabel();
    return `${formatos ? formatos + ' · ' : ''}Máximo ${this.maxSizeMb()} MB`;
  });

  private lector?: FileReader;

  constructor() {
    inject(DestroyRef).onDestroy(() => {
      this.lector?.abort();
      this.liberarVistaPrevia();
    });
  }

  alSeleccionar(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (file) this.cargar(file);
  }

  alArrastrar(event: DragEvent, dentro: boolean) {
    event.preventDefault();
    if (this.disabled()) return;
    this.arrastrando.set(dentro);
  }

  alSoltar(event: DragEvent) {
    event.preventDefault();
    this.arrastrando.set(false);
    if (this.disabled()) return;
    const file = event.dataTransfer?.files?.[0];
    if (file) this.cargar(file);
  }

  eliminar() {
    this.lector?.abort();
    this.liberarVistaPrevia();
    this.archivo.set(null);
    this.progreso.set(0);
    this.cargando.set(false);
    this.error.set(null);
    this.fileChange.emit(null);
  }

  private readonly http = inject(HttpClient);
  readonly abriendo = signal(false);

  /**
   * Abre el archivo guardado. Se descarga con HttpClient para que lleve el token de la sesión:
   * un enlace directo no lo manda y el servidor responde 401 («Por favor inicie sesión»).
   */
  abrirExistente(url: string) {
    if (this.abriendo()) return;
    // La pestaña se abre en el clic para que el navegador no la bloquee; luego se le pone el archivo.
    const ventana = window.open('', '_blank');
    this.abriendo.set(true);
    this.http.get(url, { responseType: 'blob' }).subscribe({
      next: (blob) => {
        this.abriendo.set(false);
        const objeto = URL.createObjectURL(blob);
        if (ventana) {
          ventana.location.href = objeto;
        } else {
          const enlace = document.createElement('a');
          enlace.href = objeto;
          enlace.download = this.existingName() ?? 'archivo';
          enlace.click();
        }
        setTimeout(() => URL.revokeObjectURL(objeto), 60_000);
      },
      error: () => {
        this.abriendo.set(false);
        ventana?.close();
      },
    });
  }

  quitarExistente() {
    this.existenteQuitado.set(true);
    this.existingRemoved.emit();
  }

  guardar() {
    const file = this.archivo();
    if (!file) return;
    const url = URL.createObjectURL(file);
    const enlace = document.createElement('a');
    enlace.href = url;
    enlace.download = file.name;
    enlace.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  tamano(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  }

  private cargar(file: File) {
    this.error.set(null);
    if (!this.tipoValido(file)) {
      this.error.set(`Formato no permitido${this.acceptLabel() ? '. Usa ' + this.acceptLabel() : ''}.`);
      return;
    }
    if (file.size > this.maxSizeMb() * 1024 * 1024) {
      this.error.set(`El archivo pesa ${this.tamano(file.size)}; el máximo es ${this.maxSizeMb()} MB.`);
      return;
    }
    this.lector?.abort();
    this.liberarVistaPrevia();
    this.archivo.set(file);
    this.progreso.set(0);
    this.cargando.set(true);

    const lector = new FileReader();
    this.lector = lector;
    lector.onprogress = (e) => {
      if (e.lengthComputable) this.progreso.set(Math.round((e.loaded / e.total) * 100));
    };
    lector.onload = () => {
      this.progreso.set(100);
      this.cargando.set(false);
      if (file.type.startsWith('image/')) this.vistaPrevia.set(URL.createObjectURL(file));
      this.fileChange.emit(file);
    };
    lector.onerror = () => {
      this.cargando.set(false);
      this.archivo.set(null);
      this.error.set('No se pudo leer el archivo. Intenta de nuevo.');
    };
    lector.readAsArrayBuffer(file);
  }

  private tipoValido(file: File): boolean {
    const accept = this.accept().trim();
    if (!accept || accept === '*/*') return true;
    const nombre = file.name.toLowerCase();
    return accept.split(',').map((t) => t.trim().toLowerCase()).some((tipo) => {
      if (tipo.startsWith('.')) return nombre.endsWith(tipo);
      if (tipo.endsWith('/*')) return file.type.startsWith(tipo.slice(0, -1));
      return file.type === tipo;
    });
  }

  private liberarVistaPrevia() {
    const url = this.vistaPrevia();
    if (url) URL.revokeObjectURL(url);
    this.vistaPrevia.set(null);
  }
}
