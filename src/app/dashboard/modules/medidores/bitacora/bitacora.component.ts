import { LeyendaM3Pipe, LitrosAM3Pipe } from '../utils/equivalencia-m3.pipe';
import { CommonModule } from '@angular/common';
import { Component, DestroyRef, OnInit, inject, computed, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AppPrimengModule } from '@shared/app-primeng/app-primeng.module';
import { HeaderComponent } from '@shared/components/header/header.component';
import { BotonRegresarComponent } from '@shared/components/boton-regresar/boton-regresar.component';
import { MessageService } from 'primeng/api';
import { MessageErrorComponent } from '@shared/components/message-error/message-error.component';
import { AppSharedModule } from '@shared/app-shared.module';
import { MedidorApiService } from '../services/medidor.api.service';
import { BitacoraMedicionApiService } from '../services/bitacora-medicion.api.service';
import { BitacoraMedicionCreateDto } from '../services/dtos/bitacora-medicion.create.dto';
import { BitacoraMedicionResponseDto } from '../services/dtos/bitacora-medicion.response.dto';
import { MedidorResetDto, MedidorResponseDto } from '../services/dtos/medidor.response.dto';
import { AvisoConsumo, aNumero, evaluarCaptura } from '../utils/alerta-consumo';
import { ConfirmarConsumoComponent } from '../utils/confirmar-consumo.component';

@Component({
  selector: 'app-medidor-bitacora',
  standalone: true,
  imports: [
    CommonModule,
    LeyendaM3Pipe,
    LitrosAM3Pipe,
    ReactiveFormsModule,
    AppPrimengModule,
    HeaderComponent,
    BotonRegresarComponent,
    MessageErrorComponent,
    AppSharedModule,
    ConfirmarConsumoComponent,
  ],
  templateUrl: './bitacora.component.html'
})
export class BitacoraComponent implements OnInit {
  medidorApi = inject(MedidorApiService);
  bitacoraApi = inject(BitacoraMedicionApiService);
  fb = inject(FormBuilder);
  route = inject(ActivatedRoute);
  messageService = inject(MessageService);

  idMedidor = '';
  medidor = signal<MedidorResponseDto | null>(null);
  today = new Date();

  formulario = this.fb.group({
    medicionActual: [0, [Validators.required, Validators.min(0)]],
    liquidado: [0, [Validators.min(0)]],
    quedadoEnPipa: [0, [Validators.min(0)]],
    litrosMinuto: [null as number | null, [Validators.pattern(/^-?\d+(\.\d{1,2})?$/)]],
    comentario: ['']
  });

  listaRegistros = computed<BitacoraMedicionResponseDto[]>(() => this.bitacoraApi.listAll());
  /** Lectura de hoy que se está corrigiendo (null = captura normal). */
  editando = signal<BitacoraMedicionResponseDto | null>(null);
  registroHoy = computed<BitacoraMedicionResponseDto | null>(() =>
    this.listaRegistros().find((item) => item.medidoHoy) ?? null
  );
  lecturaInicialSugerida = computed<number>(() => {
    const registroHoy = this.registroHoy();
    if (registroHoy) {
      return registroHoy.medicionInicial * 1000;
    }

    const ultimoRegistro = [...this.listaRegistros()].sort(
      (a, b) => new Date(b.cratedAt).getTime() - new Date(a.cratedAt).getTime()
    )[0];
    if (ultimoRegistro) {
      return ultimoRegistro.medicionFinal * 1000;
    }

    return (this.medidor()?.ultimaMedicion ?? 0) * 1000;
  });

  /** Confirmación previa a guardar la lectura (incluye aviso si el consumo sale de lo común). */
  confirmarConsumoVisible = false;
  confirmarLecturaLitros = 0;
  confirmarNombreMedidor = '';
  /** Aviso no restrictivo si el consumo del día sale negativo o supera la alerta del medidor. */
  avisoCaptura(): AvisoConsumo | null {
    return evaluarCaptura(
      this.formulario.get('medicionActual'),
      this.lecturaInicialSugerida(),
      this.medidor()?.alertaConsumoLitros,
    );
  }

  // ── Reiniciar / reemplazar medidor ──────────────────────────────────────
  showResetDialog = false;
  /** 'form' = captura de datos; 'confirmar' = confirmación final antes de enviar. */
  resetPaso = signal<'form' | 'confirmar'>('form');
  enviandoReset = signal(false);

  resetForm = this.fb.group({
    medicionAnterior: [null as number | string | null, [Validators.required]],
    idMedidorReemplazo: ['', [Validators.required]],
    mensaje: [''],
  });

  /** El medidor ya fue reemplazado: no recibe lecturas ni se puede reiniciar. */
  reemplazado = computed<boolean>(() => !!this.medidor()?.reemplazadoPor);

  /** Última lectura real del medidor en litros, redondeada a 2 decimales. */
  ultimaLecturaLitros = computed<number>(() => redondear2((this.medidor()?.ultimaMedicion ?? 0) * 1000));

  /**
   * Medidores elegibles como reemplazo: no es este, habilitado, no eliminado,
   * no reemplazado y sin padre ni hijos.
   */
  opcionesReemplazo = computed<Array<{ label: string; value: string }>>(() => {
    const todos = new Map<string, MedidorResponseDto>();
    const conPadre = new Set<string>();
    const conHijos = new Set<string>();

    const visitar = (medidor: MedidorResponseDto, idPadre: string | null) => {
      if (!medidor?.idMedidor) return;
      if (!todos.has(medidor.idMedidor)) todos.set(medidor.idMedidor, medidor);
      if (idPadre) conPadre.add(medidor.idMedidor);
      const hijos = medidor.medidoresHijos ?? [];
      if (hijos.length > 0) conHijos.add(medidor.idMedidor);
      for (const hijo of hijos) visitar(hijo, medidor.idMedidor);
    };
    for (const medidor of this.medidorApi.listAll()) visitar(medidor, null);

    return [...todos.values()]
      .filter((m) =>
        m.idMedidor !== this.idMedidorActual() &&
        m.enabled !== false &&
        !m.deleted &&
        !m.reemplazadoPor &&
        !conPadre.has(m.idMedidor) &&
        !conHijos.has(m.idMedidor)
      )
      .map((m) => ({ label: etiquetaMedidor(m), value: m.idMedidor }))
      .sort((a, b) => a.label.localeCompare(b.label, 'es'));
  });

  /** id del medidor en pantalla como signal (para que opcionesReemplazo reaccione al navegar). */
  private idMedidorActual = signal<string>('');

  private destroyRef = inject(DestroyRef);
  private router = inject(Router);

  ngOnInit(): void {
    // La ruta se reutiliza al ir de la bitácora de A a la de B: escuchar cambios del :id.
    this.route.paramMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      this.idMedidor = params.get('id') ?? '';
      this.idMedidorActual.set(this.idMedidor);
      this.medidor.set(null);
      this.editando.set(null);
      this.limpiarFormulario();
      this.showResetDialog = false;
      this.cargarMedidor();
      this.cargarBitacora();
    });
  }

  private cargarMedidor() {
    this.medidorApi.getOne(this.idMedidor).subscribe((resp) => this.medidor.set(resp));
  }

  /** Navega a la bitácora de otro medidor (mismo patrón que displayBitacora de principal). */
  irABitacora(idMedidor: string | null | undefined) {
    if (!idMedidor) return;
    // La ruta es 'bitacora/:id' (un solo config): '..' sube a medidores/.
    this.router.navigate(['../bitacora', idMedidor], { relativeTo: this.route });
  }

  openResetDialog() {
    if (this.reemplazado()) return;
    this.resetPaso.set('form');
    this.resetForm.reset({
      medicionAnterior: this.ultimaLecturaLitros(),
      idMedidorReemplazo: '',
      mensaje: '',
    });
    this.medidorApi.getAll().subscribe();
    this.showResetDialog = true;
  }

  /** Error de la medición anterior (null = válida). */
  errorMedicionAnterior(): string | null {
    const control = this.resetForm.get('medicionAnterior');
    if (!control) return null;
    const valor = aNumero(control.value);
    if (valor === null) return 'La medición anterior es obligatoria.';
    if (valor < 0) return 'La medición anterior no puede ser negativa.';
    if (valor < this.ultimaLecturaLitros()) {
      return 'La medición anterior no puede ser menor que la última lectura del medidor.';
    }
    return null;
  }

  nombreReemplazoSeleccionado(): string {
    const id = this.resetForm.get('idMedidorReemplazo')?.value;
    return this.opcionesReemplazo().find((o) => o.value === id)?.label ?? '';
  }

  medicionAnteriorLitros(): number {
    return aNumero(this.resetForm.get('medicionAnterior')?.value) ?? 0;
  }

  nombreMedidorActual(): string {
    const medidor = this.medidor();
    return medidor ? etiquetaMedidor(medidor) : '';
  }

  /** Paso 1 → paso 2 (confirmación final). */
  solicitarConfirmacionReset() {
    this.resetForm.markAllAsTouched();
    if (this.opcionesReemplazo().length === 0) return;
    if (this.errorMedicionAnterior() || !this.resetForm.get('idMedidorReemplazo')?.value) {
      this.messageService.add({
        key: 'center',
        severity: 'warn',
        summary: '¡Precaución!',
        detail: 'Hay campos inválidos o faltan campos por llenar.'
      });
      return;
    }
    this.resetPaso.set('confirmar');
  }

  volverAlFormularioReset() {
    this.resetPaso.set('form');
  }

  confirmReset() {
    if (this.enviandoReset()) return;
    const litros = this.medicionAnteriorLitros();
    const medidor = this.medidor();
    // Si se dejó la lectura prellenada, enviar el valor exacto del back para evitar
    // que el redondeo a 2 decimales la deje por debajo de la última lectura.
    const medicionAnterior = medidor && litros === this.ultimaLecturaLitros()
      ? (medidor.ultimaMedicion ?? 0)
      : litros / 1000;
    const mensaje = (this.resetForm.get('mensaje')?.value ?? '').trim();
    const body: MedidorResetDto = {
      idMedidor: this.idMedidor,
      idMedidorReemplazo: this.resetForm.get('idMedidorReemplazo')?.value ?? '',
      medicionAnterior,
      ...(mensaje ? { mensaje } : {}),
    };

    this.enviandoReset.set(true);
    this.medidorApi.reset(body).subscribe({
      next: () => {
        this.enviandoReset.set(false);
        this.messageService.add({
          key: 'top-right',
          severity: 'success',
          summary: 'Medidor reemplazado',
          detail: `${this.nombreMedidorActual()} fue reemplazado por ${this.nombreReemplazoSeleccionado()}.`
        });
        this.cancelReset();
        this.cargarMedidor();
        this.cargarBitacora();
        this.medidorApi.getAll().subscribe();
      },
      error: () => {
        // El interceptor ya muestra el mensaje del back (409); regresar al formulario para corregir.
        this.enviandoReset.set(false);
        this.resetPaso.set('form');
      }
    });
  }

  cancelReset() {
    this.showResetDialog = false;
    this.resetPaso.set('form');
  }

  cargarBitacora() {
    this.bitacoraApi.getAllFilter(`?idMedidor=${this.idMedidor}`).subscribe();
  }

  editarRegistroHoy() {
    const registro = this.registroHoy();
    if (!registro) return;
    this.editando.set(registro);
    this.formulario.reset({
      medicionActual: Math.round(registro.medicionFinal * 1000 * 100) / 100,
      liquidado: registro.liquidado ?? 0,
      quedadoEnPipa: registro.quedadoEnPipa ?? 0,
      litrosMinuto: registro.litrosMinuto ?? null,
      comentario: registro.comentario ?? ''
    });
  }

  cancelarEdicion() {
    this.editando.set(null);
    this.limpiarFormulario();
  }

  private limpiarFormulario() {
    this.formulario.reset({
      medicionActual: 0,
      liquidado: 0,
      quedadoEnPipa: 0,
      litrosMinuto: null,
      comentario: ''
    });
  }

  registrar(consumoConfirmado = false) {
    if (this.reemplazado()) return;
    if (this.registroHoy() && !this.editando()) {
      this.messageService.add({
        key: 'center',
        severity: 'info',
        summary: 'Lectura registrada',
        detail: 'Este medidor ya cuenta con una lectura capturada hoy.'
      });
      return;
    }

    if (!this.formulario.valid) {
      this.formulario.markAllAsTouched();
      this.messageService.add({
        key: 'center',
        severity: 'warn',
        summary: '¡Precaución!',
        detail: 'Hay campos inválidos o faltan campos por llenar.'
      });
      return;
    }

    const lecturaLitros = aNumero(this.formulario.get('medicionActual')?.value);
    if (lecturaLitros === null) {
      this.formulario.markAllAsTouched();
      this.messageService.add({
        key: 'center',
        severity: 'warn',
        summary: '¡Precaución!',
        detail: 'Captura una lectura válida en LTS.'
      });
      return;
    }

    if (!consumoConfirmado) {
      const medidor = this.medidor();
      this.confirmarLecturaLitros = lecturaLitros;
      this.confirmarNombreMedidor = medidor
        ? (medidor.alias ? `${medidor.nombre} (${medidor.alias})` : (medidor.nombre ?? ''))
        : '';
      this.confirmarConsumoVisible = true;
      return;
    }

    const form = this.formulario.getRawValue();
    const request: BitacoraMedicionCreateDto = {
      comentario: form.comentario ?? '',
      idMedidor: this.idMedidor,
      liquidado: Number(form.liquidado ?? 0),
      medicionActual: Number(form.medicionActual ?? 0) / 1000,
      quedadoEnPipa: Number(form.quedadoEnPipa ?? 0),
      litrosMinuto: form.litrosMinuto == null ? undefined : Number(form.litrosMinuto)
    };
    const edicion = this.editando();
    if (edicion) {
      this.bitacoraApi.update(edicion.id, request).subscribe(() => {
        this.messageService.add({
          key: 'top-right',
          severity: 'success',
          summary: 'Lectura actualizada',
          detail: 'Se corrigió la lectura de hoy'
        });
        this.editando.set(null);
        this.limpiarFormulario();
        this.cargarBitacora();
      });
      return;
    }

    this.bitacoraApi.create(request).subscribe(() => {
      this.messageService.add({
        key: 'top-right',
        severity: 'success',
        summary: '¡Registro exitoso!',
        detail: 'Se ha registrado la medición'
      });
      this.limpiarFormulario();
      this.cargarBitacora();
    });
  }

  getConsumo(item: BitacoraMedicionResponseDto): number {
    return (item.consumo ?? item.medicionFinal - item.medicionInicial) * 1000;
  }
}

function redondear2(valor: number): number {
  return Math.round(valor * 100) / 100;
}

function etiquetaMedidor(medidor: { nombre: string; alias?: string | null }): string {
  return medidor.alias ? `${medidor.nombre} (${medidor.alias})` : (medidor.nombre ?? '');
}
