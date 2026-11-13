import { LeyendaM3Pipe, LitrosAM3Pipe } from '../utils/equivalencia-m3.pipe';
import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, computed, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
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
import { AvisoConsumo, evaluarCaptura } from '../utils/alerta-consumo';
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
  medidor = signal<any>(null);
  today = new Date();

  formulario = this.fb.group({
    medicionActual: [0, [Validators.required, Validators.min(0)]],
    liquidado: [0, [Validators.min(0)]],
    quedadoEnPipa: [0, [Validators.min(0)]],
    litrosMinuto: [null as number | null, [Validators.pattern(/^-?\d+(\.\d{1,2})?$/)]],
    comentario: ['']
  });

  listaRegistros = computed<BitacoraMedicionResponseDto[]>(() => this.bitacoraApi.listAll());
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

  /** Aviso no restrictivo si el consumo del día sale negativo o supera la alerta del medidor. */
  confirmarConsumoVisible = false;
  avisoCaptura(): AvisoConsumo | null {
    return evaluarCaptura(
      this.formulario.get('medicionActual'),
      this.lecturaInicialSugerida(),
      this.medidor()?.alertaConsumoLitros,
    );
  }

  // Dialog reinicio
  showResetDialog = false;
  resetMensaje = '';

  ngOnInit(): void {
    this.idMedidor = this.route.snapshot.params['id'];
    this.medidorApi.getOne(this.idMedidor).subscribe(resp => this.medidor.set(resp));
    this.cargarBitacora();
  }

  openResetDialog() {
    this.resetMensaje = '';
    this.showResetDialog = true;
  }

  confirmReset() {
    const body = { idMedidor: this.idMedidor, mensaje: this.resetMensaje };
    this.medidorApi.reset(body).subscribe(() => {
      this.messageService.add({ key: 'top-right', severity: 'success', summary: 'Reinicio', detail: 'Medidor reiniciado correctamente' });
      this.showResetDialog = false;
      this.resetMensaje = '';
      this.cargarBitacora();
      // refrescar medidor por si hay cambios
      this.medidorApi.getOne(this.idMedidor).subscribe(resp => this.medidor.set(resp));
    }, (err) => {
      this.messageService.add({ key: 'top-right', severity: 'error', summary: 'Error', detail: 'No se pudo reiniciar el medidor' });
    });
  }

  cancelReset() {
    this.showResetDialog = false;
    this.resetMensaje = '';
  }

  cargarBitacora() {
    this.bitacoraApi.getAllFilter(`?idMedidor=${this.idMedidor}`).subscribe();
  }

  registrar(consumoConfirmado = false) {
    if (this.registroHoy()) {
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

    if (!consumoConfirmado && this.avisoCaptura()) {
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
    this.bitacoraApi.create(request).subscribe(() => {
      this.messageService.add({
        key: 'top-right',
        severity: 'success',
        summary: '¡Registro exitoso!',
        detail: 'Se ha registrado la medición'
      });
      this.formulario.reset({
        medicionActual: 0,
        liquidado: 0,
        quedadoEnPipa: 0,
        litrosMinuto: null,
        comentario: ''
      });
      this.cargarBitacora();
    });
  }

  getConsumo(item: BitacoraMedicionResponseDto): number {
    return (item.consumo ?? item.medicionFinal - item.medicionInicial) * 1000;
  }
}
