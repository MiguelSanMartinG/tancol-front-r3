import { CommonModule } from '@angular/common';
import { Component, computed, inject, Input, OnInit, Signal } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { SelectModel } from '@core/common/select.model';
import { AppPrimengModule } from '@shared/app-primeng/app-primeng.module';
import { AppSharedModule } from '@shared/app-shared.module';
import { MessageErrorComponent } from '@shared/components/message-error/message-error.component';
import { TipoEmpleadoApiService } from '../../tipo-empleado/services/tipo-empleado.api.service';
import { DepartamentoApiService } from '../../departamento/services/departamento.api.service';
import { DropdownModel } from '@shared/interface/dropdown.model';
import { TipoClienteApiService } from '../../tipo-cliente/services/tipo-cliente.api.service';
import { UnidadMedidaService } from '../../unidades-medida/service/unidad-medida.service';
import { environment } from '../../../../../environments/environment.development';

@Component({
  selector: 'app-form',
  templateUrl: './form.component.html',
  imports:[
    MessageErrorComponent,
    ReactiveFormsModule,
    CommonModule,
    AppSharedModule,
    AppPrimengModule,

      
  ]
  // styles: [':host{display:contents}'], // Makes component host as if it was not there, can offer less css headaches. Use @HostBinding class approach for easier overrides.
  // host: { class: 'contents' },
})
export class FormComponent implements OnInit {

  @Input() formulario!:FormGroup;
  // tipoEmpleadoApiService = inject(TipoEmpleadoApiService)
  // departamentoApiService = inject(DepartamentoApiService)
  
  tipoCliente = inject(TipoClienteApiService);
  unidadMedidaApi = inject(UnidadMedidaService);
archivoNombre: string | null = null;

url = environment.apiUrl

statusVehiculo:DropdownModel[] = [
  {
    code:'DISPONIBLE',
    name:'Disponible'
  },
  {
    code:'EN_TALLER',
    name:'En taller'
  },
  {
    code:'FUERA_DE_SERVICIO',
    name:'Fuera de servicio'
  }
]

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

        listaUnidadMedidaSeleccionar: Signal<SelectModel[]> = computed(() => {
      if (this.unidadMedidaApi.listAll().length > 0) {
        return this.unidadMedidaApi.listAll().map((row) => ({
          label: row.nombre,
          value: row.idUnidadDeMedida,
        }));
      } else {
        return [];
      }
    });

    ngOnInit(): void {
      this.tipoCliente.getAll().subscribe();
      this.unidadMedidaApi.getAllFilter('?enabled=true').subscribe();
    }

onFileSelected(event: Event): void {
  const input = event.target as HTMLInputElement;
  if (input.files && input.files[0]) {
    const file = input.files[0];

    if (file.type !== 'application/pdf') {
      this.formulario.get('documentoPoliza')?.setErrors({ invalidType: true });
      return;
    }

    this.archivoNombre = file.name;
    this.formulario.patchValue({ documentoPoliza: file });
    this.formulario.get('documentoPoliza')?.markAsDirty();
  }
}

eliminarArchivo() {
  this.archivoNombre = null;
  this.formulario.get('documentoPoliza')?.reset();
}
  // @HostBinding('class') protected readonly class = 'contents'; // Makes component host as if it was not there, can offer less css headaches. Assumes .contents{display:contents} css class exits
  // constructor() {}
}
