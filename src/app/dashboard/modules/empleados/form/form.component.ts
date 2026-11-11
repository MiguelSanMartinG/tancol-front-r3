import { CommonModule } from '@angular/common';
import { Component, computed, inject, Input, OnInit, Signal } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { SelectModel } from '@core/common/select.model';
import { AppPrimengModule } from '@shared/app-primeng/app-primeng.module';
import { AppSharedModule } from '@shared/app-shared.module';
import { MessageErrorComponent } from '@shared/components/message-error/message-error.component';
import { TipoEmpleadoApiService } from '../../tipo-empleado/services/tipo-empleado.api.service';
import { DepartamentoApiService } from '../../departamento/services/departamento.api.service';
import { RolApiService } from '../../rol/services/rol.api.service';

@Component({
  selector: 'app-form',
  templateUrl: './form.component.html',
  imports:[
    MessageErrorComponent,
    ReactiveFormsModule,
    CommonModule,
    AppSharedModule,
    AppPrimengModule
      
  ]
  // styles: [':host{display:contents}'], // Makes component host as if it was not there, can offer less css headaches. Use @HostBinding class approach for easier overrides.
  // host: { class: 'contents' },
})
export class FormComponent implements OnInit {

  @Input() formulario!:FormGroup;
  tipoEmpleadoApiService = inject(TipoEmpleadoApiService)
  departamentoApiService = inject(DepartamentoApiService)
  rolApiService = inject(RolApiService)

  listaTipoEmpleadoSelecccionar: Signal<SelectModel[]> = computed(() => {
      if (this.tipoEmpleadoApiService.listAll().length > 0) {
        return this.tipoEmpleadoApiService.listAll().map((row) => ({
          label: row.nombre,
          value: row.idTipoEmpleado,
        }));
      } else {
        return [];
      }
    });

    listaDepartamentoSeleccionar: Signal<SelectModel[]> = computed(() => {
      if (this.departamentoApiService.listDepartamento().length > 0) {
        return this.departamentoApiService.listDepartamento().map((row) => ({
          label: row.nombre,
          value: row.idDepartamento,
        }));
      } else {
        return [];
      }
    });

    listaRolSeleccionar: Signal<SelectModel[]> = computed(() => {
      if (this.rolApiService.listAll().length > 0) {
        return this.rolApiService.listAll().map((row) => ({
          label: row.name,
          value: row.id,
        }));
      } else {
        return [];
      }
    });


    
    ngOnInit(): void {
      this.tipoEmpleadoApiService.getAll().subscribe();
      this.departamentoApiService.getAll().subscribe();
      this.rolApiService.getAll().subscribe();
    }
  // @HostBinding('class') protected readonly class = 'contents'; // Makes component host as if it was not there, can offer less css headaches. Assumes .contents{display:contents} css class exits
  // constructor() {}
}
