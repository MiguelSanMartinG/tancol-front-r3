import { NgTemplateOutlet } from '@angular/common';
import { Component, ViewChild, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { alreadyTaken } from '@core/common/already-taken.validator';
import { AppPrimengModule } from '@shared/app-primeng/app-primeng.module';
import { MessageErrorComponent } from '@shared/components/message-error/message-error.component';
import { HeaderComponent } from '@shared/components/header/header.component';
import { AppSharedModule } from '@shared/app-shared.module';
import { MessageService } from 'primeng/api';
import { FormComponent } from '../form/form.component';
import { MedidorApiService } from '../services/medidor.api.service';
import { FueraEspecificacionDto } from '../../fuera-especificacion/services/fuera-especificacion-dto';
import { MedidorUpdateDto } from '../services/dtos/medidor.update.dto';
import { MedidorCreateDto } from '../services/dtos/medidor.create.dto';
import { ALERTA_CONSUMO_PATRON, alertaConsumoParaGuardar } from '../utils/alerta-consumo';

@Component({
  selector: 'app-editar-medidor',
  standalone: true,
  imports: [
    AppPrimengModule,
    ReactiveFormsModule,
    MessageErrorComponent,
    NgTemplateOutlet,
    HeaderComponent,
    AppSharedModule,
    FormComponent,
  ],
  templateUrl: './editar.component.html',
})
export class EditarComponent {
  medidorApi = inject(MedidorApiService);
  fb = inject(FormBuilder);
  router = inject(Router);
  route = inject(ActivatedRoute);
  messageService = inject(MessageService);
  @ViewChild(FormComponent) formComponent!: FormComponent;

  formulario = this.fb.group<{ [key: string]: any }>({
    nombre: ['', [Validators.required], [alreadyTaken(this.medidorApi, '?nombre=')]],
    alias: ['', [Validators.required]],
    idsSistemasAlmacenamiento: [[], [Validators.required]],
    unidadMedicion: ['', [Validators.required]],
    medicionInicial: [{value:0,disabled:true}, [Validators.required, Validators.min(0)]],
    tipoAgua: ['POTABLE', [Validators.required]],
    alertaConsumoLitros: [null as number | null, [Validators.pattern(ALERTA_CONSUMO_PATRON)]],
    id: ['', [Validators.required]],
  });

  constructor() {
    this.route.paramMap.subscribe((params) => {
      const id = params.get('id');
      if (id) {
        this.cargarDatos(id);
      }
    });
  }

  cargarDatos(id: string) {
    this.medidorApi.getOne(id).subscribe((resp) => {
      // Aseguramos que siempre sea un array
      const sistemas = Array.isArray(resp.sistemasDeAlmacenamiento)
        ? resp.sistemasDeAlmacenamiento
        : resp.sistemasDeAlmacenamiento
          ? [resp.sistemasDeAlmacenamiento]
          : [];
      this.formulario.patchValue({
        nombre: typeof resp.nombre === 'string' ? resp.nombre : '',
        alias: typeof resp.alias === 'string' ? resp.alias : '',
        idsSistemasAlmacenamiento: Array.isArray(resp.sistemasDeAlmacenamiento)
          ? resp.sistemasDeAlmacenamiento.map((s) => s.id)
          : [],
        unidadMedicion: typeof resp.unidadMedida?.idUnidadDeMedida === 'string' ? resp.unidadMedida.idUnidadDeMedida : '',
        medicionInicial: (resp.ultimaMedicion ?? 0) * 1000,
        tipoAgua: typeof resp.tipoAgua === 'string' ? resp.tipoAgua : '',
        alertaConsumoLitros: resp.alertaConsumoLitros ?? null,
        id: typeof id === 'string' ? id : '',
      }, { emitEvent: false });
    });
  }

  validarRegistros() {
    if (!this.formulario.valid) {
      this.formulario.markAllAsTouched();
      this.messageService.add({
        key: 'center',
        severity: 'warn',
        summary: '!Precaución!',
        detail: 'Hay campos inválidos o faltan campos por llenar.',
      });
      return;
    }
    const form = this.formulario.getRawValue();
    const idsSistemasAlmacenamiento = Array.isArray(form['idsSistemasAlmacenamiento'])
      ? form['idsSistemasAlmacenamiento']
      : form['idsSistemasAlmacenamiento']
        ? [form['idsSistemasAlmacenamiento']]
        : [];
    const request: MedidorCreateDto = {
      nombre: typeof form['nombre'] === 'string' ? form['nombre'] : '',
      alias: typeof form['alias'] === 'string' ? form['alias'] : '',
      idsSistemasAlmacenamiento,
      unidadMedicion: typeof form['unidadMedicion'] === 'string' ? form['unidadMedicion'] : '',
      // medicionInicial: parseFloat(form['medicionInicial'] as any),
      tipoAgua: typeof form['tipoAgua'] === 'string' ? form['tipoAgua'] as any : '',
      alertaConsumoLitros: alertaConsumoParaGuardar(form['alertaConsumoLitros']),
    };
    this.medidorApi.update(request, typeof form['id'] === 'string' ? form['id'] : '').subscribe(() => {
      this.formulario.reset();
      this.messageService.clear();
      this.router.navigate(['../../'], { relativeTo: this.route });
      this.messageService.add({
        key: 'top-right',
        severity: 'success',
        summary: '¡Actualización exitosa!',
        detail: 'Se ha actualizado el medidor',
      });
    });
  }

  handleHide() {
    this.formulario.reset();
  }
}
