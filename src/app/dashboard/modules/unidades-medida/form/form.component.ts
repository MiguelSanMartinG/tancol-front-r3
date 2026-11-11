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


    ngOnInit(): void {
    }
  // @HostBinding('class') protected readonly class = 'contents'; // Makes component host as if it was not there, can offer less css headaches. Assumes .contents{display:contents} css class exits
  // constructor() {}
}
