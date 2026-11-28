import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, OnDestroy, ViewChild, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { AppPrimengModule } from '@shared/app-primeng/app-primeng.module';
import { BotonRegresarComponent } from '@shared/components/boton-regresar/boton-regresar.component';
import { DialogFirmaComponent } from '@shared/components/dialog-firma/dialog-firma.component';
import { HeaderComponent } from '@shared/components/header/header.component';
import { DatetimePipe } from '@shared/pipes/datetime.pipe';
import { LocalStorageService } from '@shared/services/local-storage.service';
import { UploadFileApiService } from '@shared/services/upload-file.api.service';
import { MessageService } from 'primeng/api';
import { InputNumberModule } from 'primeng/inputnumber';
import { RadioButtonModule } from 'primeng/radiobutton';
import { Observable, finalize, switchMap, throwError } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { CuadreInventarioApiService } from '../services/cuadre-inventario.api.service';
import { CuadreCategoria, CuadreDetalle, CuadrePartida, etiquetaTipoCuadre } from '../services/cuadre-inventario.model';

const DECIMALES = 4;

@Component({
  selector: 'app-cuadre-inventario-detalle',
  imports: [
    CommonModule,
    FormsModule,
    AppPrimengModule,
    InputNumberModule,
    RadioButtonModule,
    BotonRegresarComponent,
    HeaderComponent,
    DatetimePipe,
    DialogFirmaComponent,
  ],
  templateUrl: './detalle.component.html',
})
export class DetalleComponent implements OnDestroy {
  readonly etiquetaTipo = etiquetaTipoCuadre;

  categoriasTexto(cs: CuadreCategoria[]): string {
    return cs.map((c) => c.nombre).join(', ');
  }

  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);
  private readonly messageService = inject(MessageService);
  private readonly localStorage = inject(LocalStorageService);
  private readonly uploadFileApi = inject(UploadFileApiService);
  private readonly cuadreApiService = inject(CuadreInventarioApiService);

  @ViewChild(DialogFirmaComponent) dialogFirma?: DialogFirmaComponent;

  readonly cuadre = signal<CuadreDetalle | null>(null);
  /** Copia editable de las partidas (se modifica en sitio al capturar). */
  readonly partidas = signal<CuadrePartida[]>([]);
  /** Se incrementa en cada captura para recalcular el resumen sin recrear la lista. */
  private readonly revision = signal(0);
  readonly busqueda = signal('');

  observaciones = '';
  cambiosSinGuardar = false;
  readonly guardando = signal(false);
  readonly cerrando = signal(false);

  // ---- Diálogo de confirmación de cierre ----
  displayCierre = false;
  ajustarExistencia: boolean | null = null;
  fechaHoraActual = new Date();
  private reloj: ReturnType<typeof setInterval> | null = null;

  readonly abierto = computed(() => this.cuadre()?.estado === 'ABIERTO');

  readonly partidasFiltradas = computed(() => {
    const texto = normalizar(this.busqueda().trim());
    const lista = this.partidas();
    if (!texto) return lista;
    return lista.filter(
      (p) => normalizar(p.producto ?? '').includes(texto) || normalizar(p.sku ?? '').includes(texto)
    );
  });

  readonly resumen = computed(() => {
    this.revision();
    const lista = this.partidas();
    let capturadas = 0;
    let conDiferencia = 0;
    let sobrantes = 0;
    let faltantes = 0;
    for (const p of lista) {
      const dif = this.diferencia(p);
      if (dif === null) continue;
      capturadas++;
      if (dif !== 0) conDiferencia++;
      if (dif > 0) sobrantes++;
      if (dif < 0) faltantes++;
    }
    return {
      total: lista.length,
      capturadas,
      pendientes: lista.length - capturadas,
      conDiferencia,
      sobrantes,
      faltantes,
    };
  });

  get usuarioSesion(): string {
    // Mismo origen que el encabezado del dashboard y salida-material (userInfo del login).
    return String(this.localStorage.getUserInfo()?.nombre ?? '').trim() || 'Usuario';
  }

  get urlFirma(): string {
    const id = this.cuadre()?.idImagenFirma;
    return id ? `${environment.apiUrl}images/${id}` : '';
  }

  constructor() {
    this.route.paramMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      const id = params.get('id');
      if (id) this.cargar(id);
    });
  }

  ngOnDestroy(): void {
    this.detenerReloj();
  }

  cargar(id: string): void {
    this.cuadreApiService.getOne(id).subscribe((resp) => this.aplicar(resp));
  }

  private aplicar(resp: CuadreDetalle): void {
    this.cuadre.set(resp);
    this.partidas.set((resp.partidas ?? []).map((p) => ({ ...p })));
    this.observaciones = resp.observaciones ?? '';
    this.cambiosSinGuardar = false;
    this.revision.update((v) => v + 1);
  }

  // ---- Captura ----
  onCantidadChange(partida: CuadrePartida, valor: number | null | undefined): void {
    partida.cantidadFisica = valor === undefined || valor === null || Number.isNaN(valor) ? null : valor;
    partida.diferencia = this.diferencia(partida);
    this.cambiosSinGuardar = true;
    this.revision.update((v) => v + 1);
  }

  onObservacionesChange(): void {
    this.cambiosSinGuardar = true;
  }

  diferencia(partida: CuadrePartida): number | null {
    if (partida.cantidadFisica === null || partida.cantidadFisica === undefined) return null;
    const factor = 10 ** DECIMALES;
    return Math.round((partida.cantidadFisica - partida.cantidadSistema) * factor) / factor;
  }

  formatoDiferencia(valor: number | null): string {
    if (valor === null) return '';
    const texto = formatearNumero(Math.abs(valor));
    if (valor > 0) return `+${texto}`;
    if (valor < 0) return `-${texto}`;
    return texto;
  }

  claseDiferencia(valor: number | null): string {
    if (valor === null) return '';
    if (valor > 0) return 'text-green-600 font-semibold';
    if (valor < 0) return 'text-red-600 font-semibold';
    return 'text-gray-500';
  }

  formatoCantidad(valor: number | null): string {
    return valor === null ? '' : formatearNumero(valor);
  }

  // ---- Guardar avance ----
  private guardar$(): Observable<CuadreDetalle> | null {
    const cuadre = this.cuadre();
    if (!cuadre || cuadre.estado !== 'ABIERTO') return null;
    return this.cuadreApiService.guardarPartidas(cuadre.id, {
      partidas: this.partidas().map((p) => ({ idPartida: p.idPartida, cantidadFisica: p.cantidadFisica })),
      observaciones: this.observacionesNormalizadas(),
    });
  }

  guardarAvance(): void {
    const req = this.guardar$();
    if (!req || this.guardando()) return;
    this.guardando.set(true);
    req.pipe(finalize(() => this.guardando.set(false))).subscribe({
      next: (resp) => {
        this.aplicar(resp);
        this.messageService.add({
          key: 'top-right',
          severity: 'success',
          summary: 'Avance guardado',
          detail: 'Se guardaron las cantidades capturadas.',
        });
      },
      // El interceptor muestra el error del back (p. ej. 409 si el cuadre ya está cerrado).
      error: (error) => this.recargarSi409(error),
    });
  }

  // ---- Cierre ----
  iniciarCierre(): void {
    if (this.resumen().capturadas === 0 || this.guardando() || this.cerrando()) return;
    const req = this.guardar$();
    if (!req) return;
    this.guardando.set(true);
    req.pipe(finalize(() => this.guardando.set(false))).subscribe({
      next: (resp) => {
        this.aplicar(resp);
        if (this.resumen().capturadas === 0) return;
        this.ajustarExistencia = null;
        this.fechaHoraActual = new Date();
        this.iniciarReloj();
        this.displayCierre = true;
      },
      error: (error) => this.recargarSi409(error),
    });
  }

  cancelarCierre(): void {
    this.displayCierre = false;
  }

  onHideCierre(): void {
    this.detenerReloj();
  }

  continuarAFirma(): void {
    if (this.ajustarExistencia === null) return;
    this.displayCierre = false;
    this.dialogFirma?.open();
  }

  onFirmaConfirmada(file: File): void {
    const cuadre = this.cuadre();
    const ajustar = this.ajustarExistencia;
    if (!cuadre || ajustar === null || this.cerrando()) return;
    this.cerrando.set(true);
    this.uploadFileApi
      .create(file)
      .pipe(
        switchMap((resp) => {
          if (!resp?.fileName) {
            return throwError(() => new Error('No se pudo subir la firma de cierre.'));
          }
          return this.cuadreApiService.cerrar(cuadre.id, {
            idImagenFirma: resp.fileName,
            ajustarExistencia: ajustar,
            observaciones: this.observacionesNormalizadas(),
          });
        }),
        finalize(() => this.cerrando.set(false))
      )
      .subscribe({
        next: (resp) => {
          this.messageService.add({
            key: 'top-right',
            severity: 'success',
            summary: 'Cuadre cerrado',
            detail: ajustar
              ? `Se cerró el cuadre ${resp.folio} y se ajustó la existencia del inventario.`
              : `Se cerró el cuadre ${resp.folio} como registro (sin ajustar existencia).`,
          });
          this.cargar(cuadre.id);
        },
        error: (error) => {
          // Los errores HTTP ya los muestra el interceptor; solo se avisa de los locales.
          if (!(error instanceof HttpErrorResponse)) {
            this.messageService.add({
              key: 'top-right',
              severity: 'error',
              summary: 'No se pudo cerrar',
              detail: error?.message ?? 'No se pudo cerrar el cuadre.',
            });
            return;
          }
          this.recargarSi409(error);
        },
      });
  }

  private recargarSi409(error: unknown): void {
    const id = this.cuadre()?.id;
    if (id && error instanceof HttpErrorResponse && error.status === 409) this.cargar(id);
  }

  private observacionesNormalizadas(): string | null {
    const texto = this.observaciones.trim();
    return texto ? texto : null;
  }

  private iniciarReloj(): void {
    this.detenerReloj();
    this.reloj = setInterval(() => (this.fechaHoraActual = new Date()), 1000);
  }

  private detenerReloj(): void {
    if (this.reloj) clearInterval(this.reloj);
    this.reloj = null;
  }
}

function normalizar(value: string): string {
  return value.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();
}

const formatoNumero = new Intl.NumberFormat('es-MX', {
  minimumFractionDigits: 0,
  maximumFractionDigits: DECIMALES,
});

function formatearNumero(valor: number): string {
  return formatoNumero.format(valor);
}
