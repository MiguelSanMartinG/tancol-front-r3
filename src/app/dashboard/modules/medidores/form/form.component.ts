import { CommonModule } from '@angular/common';
import { Component, Input, OnInit, computed, inject, Signal } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { AppPrimengModule } from '@shared/app-primeng/app-primeng.module';
import { AppSharedModule } from '@shared/app-shared.module';
import { MessageErrorComponent } from '@shared/components/message-error/message-error.component';
import { DropdownModel } from '@shared/interface/dropdown.model';
import { SelectModel } from '@core/common/select.model';
import { SoloNumerosEnterosDirective } from '@shared/directive/solo-numeros-enteros.directive';
import { SistemaAlmacenamientoApiService } from '../../sistema-almacenamiento/services/sistema-almacenamiento.api.service';
import { UnidadMedidaService } from '../../unidades-medida/service/unidad-medida.service';

@Component({
  selector: 'app-medidor-form',
  templateUrl: './form.component.html',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    AppPrimengModule,
    AppSharedModule,
    MessageErrorComponent,
    SoloNumerosEnterosDirective,
  ],
})
export class FormComponent implements OnInit {
  @Input() formulario!: FormGroup;

  sistemaAlmacenamientoApi = inject(SistemaAlmacenamientoApiService);
  unidadMedidaApi = inject(UnidadMedidaService);

  listaSistemasAlmacenamiento: Signal<SelectModel[]> = computed(() => {
    return this.sistemaAlmacenamientoApi.listAll().map((row) => ({
      label: row.nombre,
      value: row.id,
    }));
  });

  listaUnidadesMedida: Signal<SelectModel[]> = computed(() => {
    return this.unidadMedidaApi.listAll().map((row) => ({
      label: row.nombre,
      value: row.idUnidadDeMedida,
    }));
  });

  tipoAguaOptions: DropdownModel[] = [
    { code: 'POTABLE', name: 'Potable' },
    { code: 'DESMINERALIZADA', name: 'Desmineralizada' },
    { code: 'PURIFICADA', name: 'Purificada' },
  ];

  ngOnInit(): void {
    this.sistemaAlmacenamientoApi.getAll().subscribe();
    this.unidadMedidaApi.getAllFilter('?enabled=true').subscribe();
  }
}
