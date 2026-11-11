import { NgTemplateOutlet } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AppPrimengModule } from '@shared/app-primeng/app-primeng.module';
import { MessageErrorComponent } from '@shared/components/message-error/message-error.component';
import { MessageService } from 'primeng/api';
import { HeaderComponent } from '@shared/components/header/header.component';
import { ActivatedRoute, Router } from '@angular/router';
import { AppSharedModule } from '@shared/app-shared.module';
import { ClienteApiService } from '../services/cliente.service';
import { FormComponent } from '../form/form.component';
import { ClienteDTO } from '../services/cliente.dto';

@Component({
  selector: 'app-registrar',
  imports: [
    AppPrimengModule, 
    ReactiveFormsModule, 
    MessageErrorComponent,  
    NgTemplateOutlet,
    HeaderComponent,
    AppSharedModule,
    FormComponent

  ],
  templateUrl: './registrar.component.html',
  styleUrl: './registrar.component.scss',
})
export class RegistrarComponent {
  ClienteApiService = inject(ClienteApiService);
  fb = inject(FormBuilder);
    router = inject(Router);
    route = inject(ActivatedRoute);
  
  formulario = this.fb.group({
    nombre: ['', [Validators.required],[]],
    tipoContribuyente: ['', []],
    comentario:[''],
    tipoCliente: ['', [Validators.required]],
    condicionPago: ['', [Validators.required]],
    diasCredito:[''],
    correo: ['', []],
    ruta:['',[]],
    telefono: ['', []],
    clienteDesde: ['', [Validators.required]],
    tipoContribuyenteInfofiscal: ['', []],
    razonSocial:['', []],
    rfc:['', []],
    cp:['', []],
    tipoVialidad:['', []],
    nombreVialidad:['', []],
    numExt:['', []],
    numInt:[''],
    colonia:['', []],
    localidad:['', []],
    municipio:['', []],
    entidadFederativa:['', []],
    entreCalle:['', []],
    calle:['', []]

  });
  messageService = inject(MessageService);

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
    const formValue = this.formulario.getRawValue();
    console.log(formValue);
    let request:ClienteDTO = {
      comentario:formValue.comentario!,
      correo: formValue.correo!,
      idRuta: formValue.ruta!,
      diasDeCredito:(formValue.diasCredito != '')?parseFloat(formValue.diasCredito!) :0,
      fechaAlta: formValue.clienteDesde!,
      nombreComercial: formValue.nombre!,
      telefono: formValue.telefono!,
      idTipoDeCliente: formValue.tipoCliente!,
      tipoPago: formValue.condicionPago!,
      informacionFiscal:{
        calle1: formValue.calle!,
        calle2: formValue.calle!,
        codigoPostal: formValue.cp!,
        colonia: formValue.colonia!,
        entidadFederativa: formValue.entidadFederativa!,
        localidad: formValue.localidad!,
        municipio: formValue.municipio!,
        nombreVialidad: formValue.nombreVialidad!,
        numeroExterior: formValue.numExt!,
        numeroInterior: formValue.numInt!,
        razonSocial: formValue.razonSocial!,
        rfc: formValue.rfc!,
        tipoContribuyente: formValue.tipoContribuyenteInfofiscal || null,
        tipoVialidad: formValue.tipoVialidad!,
      }
    }

    this.ClienteApiService.create(request)
      .subscribe((resp) => {
        console.log(resp);
        // this.display = false;
        this.formulario.reset();
        this.messageService.clear();
        this.router.navigate(['../'], { relativeTo: this.route });
        this.messageService.add({
          key: 'top-right',
          severity: 'success',
          summary: '¡Registro exitoso!',
          detail: 'Se ha registrado el tipo de cliente',
        });
      });
  }
  handleHide(){
    this.formulario.reset();
  }

}
