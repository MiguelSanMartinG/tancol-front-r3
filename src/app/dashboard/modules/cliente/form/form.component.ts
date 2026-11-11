import { CommonModule } from '@angular/common';
import { Component, computed, inject, Input, OnInit, Signal } from '@angular/core';
import { FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { SelectModel } from '@core/common/select.model';
import { AppPrimengModule } from '@shared/app-primeng/app-primeng.module';
import { AppSharedModule } from '@shared/app-shared.module';
import { MessageErrorComponent } from '@shared/components/message-error/message-error.component';
import { TipoEmpleadoApiService } from '../../tipo-empleado/services/tipo-empleado.api.service';
import { DepartamentoApiService } from '../../departamento/services/departamento.api.service';
import { DropdownModel } from '@shared/interface/dropdown.model';
import { TipoClienteApiService } from '../../tipo-cliente/services/tipo-cliente.api.service';
import { RutasApiService } from '../../rutas/services/rutas-api.service';
import { CommonService } from '@shared/services/common.service';

@Component({
  selector: 'app-form',
  templateUrl: './form.component.html',
    styleUrl: './form.component.scss',
  imports:[
    MessageErrorComponent,
    ReactiveFormsModule,
    CommonModule,
    AppSharedModule,
    AppPrimengModule
  ],
})
export class FormComponent implements OnInit {

  @Input() formulario!:FormGroup;
  @Input() readonly:boolean = false;
  @Input() nombreComercialAnterior: string = '-';
  @Input() razonSocialAnterior: string = '-';
  tipoCliente = inject(TipoClienteApiService);
  commonService = inject(CommonService)
  ruta = inject (RutasApiService);
  titleTooltip:string = 'En el caso de contar con la Constancia de Situación Fiscal (CIF) para facturar la informacion debe ser idpentica a la constancia incluyendo: Mayúsculas y sígnos.'

   tipoContribuyente:DropdownModel[] = [
      {
        name:'Física',
        code:'FISICA'
      },
      {
        name:'Moral',
        code:'MORAL'
      }
    ]
    condicionPago:DropdownModel[] = this.commonService.getCondicionPago();

  listaTipoClienteSelecccionar: Signal<SelectModel[]> = computed(() => {
      if (this.tipoCliente.listAll().length > 0) {
        return this.tipoCliente.listAll().map((row) => ({
          label: row.nombre,
          value: row.idTiposClientes,
        }));
      } else {
        return [];
      }
    });
  
  listaRutasSeleccionar: Signal<SelectModel[]> = computed(() => {
      if (this.ruta.listAll().length > 0) {
        return this.ruta.listAll().map((row) => ({
          label: row.nombre,
          value: row.id,
        }));
      } else {
        return [];
      }
    });

    ngOnInit(): void {
      this.tipoCliente.getAll().subscribe();
      this.ruta.getAll().subscribe();
      const diasCtrl = this.formulario.get('diasCredito');
      const condPagoCtrl = this.formulario.get('condicionPago');

      const applyCreditoValidators = (value: string | null) => {
        if (value === 'CREDITO') {
          diasCtrl?.setValidators([Validators.required, Validators.min(1)]);
        } else {
          diasCtrl?.clearValidators();
          diasCtrl?.setValue('');
        }
        diasCtrl?.updateValueAndValidity();
      };

      applyCreditoValidators(condPagoCtrl?.value);
      condPagoCtrl?.valueChanges.subscribe(applyCreditoValidators);
    }
}
