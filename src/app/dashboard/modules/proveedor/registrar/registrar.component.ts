import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AppPrimengModule } from '@shared/app-primeng/app-primeng.module';
import { MessageService } from 'primeng/api';
import { ProveedorApiService } from '../services/proveedor.api.service';
import { MessageErrorComponent } from '../../../../shared/components/message-error/message-error.component';
import { NgTemplateOutlet } from '@angular/common';
import { alreadyTaken } from '@core/common/already-taken.validator';
import { HeaderComponent } from '@shared/components/header/header.component';
import { AppSharedModule } from '@shared/app-shared.module';
import { DropdownModel } from '@shared/interface/dropdown.model';
import { TipoProveedorApiService } from '../../tipo-proveedor/services/tipo-proveedor.api.service';
import { ProveedorCreateDto } from '../services/dtos/proveedor.create.dto';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonService } from '@shared/services/common.service';

@Component({
  selector: 'app-registrar-proveedor',
  imports: [
    AppPrimengModule, 
    ReactiveFormsModule, 
    MessageErrorComponent,  
    NgTemplateOutlet,
    HeaderComponent,
    AppSharedModule
  ],
  templateUrl: './registrar.component.html',
  styleUrl: './registrar.component.scss',
})
export class RegistrarProveedorComponent implements OnInit {

  display = true;
  proveedorApiService = inject(ProveedorApiService);
  tipoProveedorApiService = inject(TipoProveedorApiService);
    commonService = inject(CommonService)
  
  fb = inject(FormBuilder);
  formulario = this.fb.group({
    nombreComercial: ['', [Validators.required]],
    // nombreComercial: ['', [Validators.required],[alreadyTaken(this.proveedorApiService,'?nombreComercial=')]],
    tipoContribuyente: ['' ],
    idsTipoProveedor: [<string[]>[], [Validators.required]],
    condicionPago: ['', [Validators.required]],
    correo: ['', [Validators.required]],
    telefono: ['', [Validators.required]],
    razonSocial:[''],
    rfc:['' ],
    cp:['' ],
    tipoVialidad:['' ],
    nombreVialidad:['' ],
    numExt:[''],
    numInt:[''],
    colonia:[''],
    localidad:[''],
    municipio:[''],
    entidadFederativa:[''],
    entreCalle:[''],
    calle:['']
  });
  messageService = inject(MessageService);

  tipoContribuyente:DropdownModel[] = [
    {
      name:'Físico',
      code:'FISICO'
    },
    {
      name:'Moral',
      code:'MORAL'
    }
  ]

  tipoProveedor:DropdownModel[] = []
  condicionPago:DropdownModel[] = this.commonService.getCondicionPago();
  router = inject(Router);
  route = inject(ActivatedRoute);
  titleTooltip:string = 'En el caso de contar con la Constancia de Situación Fiscal (CIF) para facturar la informacion debe ser idpentica a la constancia incluyendo: Mayúsculas y sígnos.'

  ngOnInit(): void {
    this.tipoProveedorApiService.getAll().subscribe();
  }

  submit() {
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

    const request:ProveedorCreateDto = {
      nombreComercial:formValue.nombreComercial as string,
      idsTipoProveedor:formValue.idsTipoProveedor as string[],
      condicionPago:formValue.condicionPago as string,
      correo:formValue.correo as string,
      telefono:formValue.telefono as string,
      // tipoContribuyente:formValue.tipoContribuyente as string,
      enabled:true,
      informacionFiscal:{
        calle1:formValue.entreCalle as string,
        calle2:formValue.calle as string,
        entidadFederativa:formValue.entidadFederativa as string,
        razonSocial:formValue.razonSocial as string,
        rfc:formValue.rfc as string,
        codigoPostal:formValue.cp as string,
        tipoVialidad:formValue.tipoVialidad as string,
        nombreVialidad:formValue.nombreVialidad as string,
        numeroExterior:formValue.numExt as string,
        numeroInterior:formValue.numInt as string,
        colonia:formValue.colonia as string,
        localidad:formValue.localidad as string,
        municipio:formValue.municipio as string,
        tipoContribuyente:(formValue.tipoContribuyente)?formValue.tipoContribuyente as string:'FISICA'
      }

    }

    this.proveedorApiService.create(request).subscribe((resp)=>{
      console.log(resp);
        this.formulario.reset();
        this.router.navigate(['../'], { relativeTo: this.route });
        this.messageService.clear();
        this.messageService.add({
          key: 'top-right',
          severity: 'success',
          summary: '¡Registro exitoso!',
          detail: 'Se ha registrado el proveedor',
        });
    },(error)=>{
      console.log(error);
    })


    // this.proveedorApiService
    //   .create({
    //     nombre: this.formulario.getRawValue().nombre!,
    //     razonSocial: formValue.alias!
    //   })
    //   .subscribe((resp) => {
    //     this.display = false;
    //     this.formulario.reset();
    //     this.messageService.clear();
    //     this.messageService.add({
    //       key: 'top-right',
    //       severity: 'success',
    //       summary: '¡Registro exitoso!',
    //       detail: 'Se ha registrado el proveedor',
    //     });
    //   });
  }
  handleHide(){
    this.formulario.reset();
  }
  validarRegistros(){
    this.submit();
  }
}
