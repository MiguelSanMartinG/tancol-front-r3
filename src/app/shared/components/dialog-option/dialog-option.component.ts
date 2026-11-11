import { NgTemplateOutlet } from '@angular/common';
import { Component, effect, EventEmitter, inject, Output, signal, untracked } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { TipoImpuestoResponseDto } from '@app/dashboard/modules/tipo-impuesto/services/dtos/tipo-impuesto.response.dto';
import { TipoImpuestoApiService } from '@app/dashboard/modules/tipo-impuesto/services/tipo-impuesto.api.service';
import { AppPrimengModule } from '@shared/app-primeng/app-primeng.module';
import { MessageService } from 'primeng/api';
import { MessageErrorComponent } from '../message-error/message-error.component';
import { StatusBinaryReadOnlyComponent } from '../status-binary-read-only/status-binary-read-only.component';

@Component({
  selector: 'app-dialog-option',
  templateUrl: './dialog-option.component.html',
  standalone:true,
      imports:[
            AppPrimengModule,
            ReactiveFormsModule,
            MessageErrorComponent,
            NgTemplateOutlet,
            StatusBinaryReadOnlyComponent,
      ],
  // styles: [':host{display:contents}'], // Makes component host as if it was not there, can offer less css headaches. Use @HostBinding class approach for easier overrides.
  // host: { class: 'contents' },
})
export class DialogOptionComponent {
display = false;
  tipoImpuestoApiService = inject(TipoImpuestoApiService);
  itemDto = signal<TipoImpuestoResponseDto | null>(null);
  fb = inject(FormBuilder);
  formulario = this.fb.group({
    nombre: [{ disabled: true, value: '' }, Validators.required],
    status: [{ disabled: true, value: false }, Validators.required],
  });
  messageService = inject(MessageService);
  icon:string = '';
  title:string = '';
  description:string = '';
  labelBtn:string = 'Cancelar';
  color:string = 'black'
  option1label:string = '';
  option2label:string = '';
  option1Severity:any = 'secondary';
  option2Severity:any = 'secondary';
  id:string = '';
  @Output() dialogOption1 = new EventEmitter<string>();
  @Output() dialogOption2 = new EventEmitter<string>();

  option1(){
    console.log(1);
    this.dialogOption1.emit(this.id);
  }
  option2(){
    console.log(2);
    this.dialogOption2.emit(this.id);
  }

}
