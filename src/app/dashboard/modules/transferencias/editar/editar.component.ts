import { Component, effect, inject, signal, untracked } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { AppPrimengModule } from '@shared/app-primeng/app-primeng.module';
import { MessageErrorComponent } from '@shared/components/message-error/message-error.component';
import { MessageService } from 'primeng/api';
import { NgTemplateOutlet } from '@angular/common';
import { StatusBinaryReadOnlyComponent } from '../../../../shared/components/status-binary-read-only/status-binary-read-only.component';
import { alreadyTakenUpdate } from '@core/common/already-taken.validator';
import { TransferenciaService } from '../service/transferencia.service';
import { FormComponent } from '../form/form.component';
import { HeaderComponent } from '@shared/components/header/header.component';
import { ActivatedRoute, Router } from '@angular/router';
import { AppSharedModule } from '@shared/app-shared.module';

@Component({
  selector: 'app-editar',
  imports: [
    AppPrimengModule,
    ReactiveFormsModule,
    MessageErrorComponent,
    NgTemplateOutlet,
    StatusBinaryReadOnlyComponent,
        FormComponent,
        HeaderComponent,
        AppSharedModule
  ],
  templateUrl: './editar.component.html',
  styleUrl: './editar.component.scss',
})
export class EditarComponent {
  display = false;
  treansferenciaApiService = inject(TransferenciaService);
  itemDto = signal<any | null>(null);
  fb = inject(FormBuilder);
      router = inject(Router);
      route = inject(ActivatedRoute);
  formulario = this.fb.group({
    motivo: [''],
    folio:[{value:'',disabled:true}],
    entregadoPor:[{value:'',disabled:true},[Validators.required]],
    fecha:[new Date(),Validators.required],
    almacenBase:['',Validators.required],
    almacenDestino:['',Validators.required]
  });
    listaPartidas:any[] = []
  messageService = inject(MessageService);
    constructor(){
      this.route.paramMap.subscribe(params => {
        const id = params.get('id');
        console.log('id',id);

        if (id) {
          this.cargarDatos(id);
        }

      })

    }
  
  cargarDatos(id:string){
    this.treansferenciaApiService.getOne(id).subscribe({
      next:(response)=>{
        console.log(response);
        this.formulario.patchValue({
          motivo: response.motivo,
          folio: response.idTransferencia,
          entregadoPor: response.idEmpleado?.nombre,
          fecha: new Date(response.fechaTransferencia),
          almacenBase: response.transferencias[0]?.idAlmacenOrigen,
          almacenDestino: response.transferencias[0]?.idAlmacenDestino
        });
        this.listaPartidas = response.transferencias.map((t)=>({
          comentario: t.comentario ?? '',
          producto: { producto:  t.producto },
          cantidad: t.cantidadTrasferida ?? 0,
          unidadMedida: t.unidadesMedida?.nombre ?? '',
          stock: t.stock ?? 0,
          id: t.id
        }));
        this.formulario.disable();
      }
    })
  }

  handleHide() {
    this.formulario.reset();
  }
}
