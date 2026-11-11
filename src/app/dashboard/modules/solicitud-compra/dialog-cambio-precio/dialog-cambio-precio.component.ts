import { NgTemplateOutlet } from '@angular/common';
import { Component, effect, EventEmitter, inject, Output, signal, untracked } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AppPrimengModule } from '@shared/app-primeng/app-primeng.module';
import { MessageErrorComponent } from '@shared/components/message-error/message-error.component';
import { StatusBinaryReadOnlyComponent } from '@shared/components/status-binary-read-only/status-binary-read-only.component';
import { TipoImpuestoApiService } from '../../tipo-impuesto/services/tipo-impuesto.api.service';
import { TipoImpuestoResponseDto } from '../../tipo-impuesto/services/dtos/tipo-impuesto.response.dto';
import { MessageService } from 'primeng/api';

@Component({
  selector: 'app-dialog-cambio-precio',
  templateUrl: './dialog-cambio-precio.component.html',
  imports:[
        AppPrimengModule,
        ReactiveFormsModule,
        MessageErrorComponent,
        NgTemplateOutlet,
        StatusBinaryReadOnlyComponent,
  ],
  standalone:true
  // styles: [':host{display:contents}'], // Makes component host as if it was not there, can offer less css headaches. Use @HostBinding class approach for easier overrides.
  // host: { class: 'contents' },
})
export class DialogCambioPrecioComponent {
  display = false;
  tipoImpuestoApiService = inject(TipoImpuestoApiService);
  itemDto = signal<TipoImpuestoResponseDto | null>(null);
  fb = inject(FormBuilder);
  formulario = this.fb.group({
    nombre: [{ disabled: true, value: '' }, Validators.required],
    status: [{ disabled: true, value: false }, Validators.required],
  });
  messageService = inject(MessageService);

  productName!:string;
  originalPrice!:string;
  newPrice!:string;
  partidaId!:string;
  @Output() dialogEvent = new EventEmitter<{id:string,action:boolean}>();

  constructor() {
    effect(() => {
      if (this.itemDto() !== null) {
        untracked(() => {
          this.formulario.patchValue({
            nombre: this.itemDto()!.nombre,
            status: this.itemDto()!.enabled,
          });
        });
      }
    });
  }
  submit() {
    this.tipoImpuestoApiService.delete(this.itemDto()!.id).subscribe((resp) => {
      this.handleHide();
      this.messageService.clear();
      this.messageService.add({
        key: 'top-right',
        severity: 'success',
        summary: 'Eliminación exitosa',
        detail: 'Se ha eliminado el tipo de impuesto',
      });
    });
  }
  handleHide() {
    this.display = false;
    this.formulario.reset();
  }

  confirm(){
    this.display = false;
    this.dialogEvent.emit({id:this.partidaId,action:true});

          // this.solicitudCompraApiService.setPrecioProducto({
      //   idPrecio: item.idPrecio,
      //   precio: item.precioUnitario
      // }).subscribe( res => {
      //   item.precio = res.precio;
      // })
  }

  cancel(){
    this.display = false;
    this.dialogEvent.emit({id:this.partidaId,action:false});
  }

}
