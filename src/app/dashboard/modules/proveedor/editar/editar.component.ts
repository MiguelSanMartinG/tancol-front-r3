import { Component, effect, inject, signal, untracked } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { AppPrimengModule } from '@shared/app-primeng/app-primeng.module';
import { MessageErrorComponent } from '@shared/components/message-error/message-error.component';
import { MessageService } from 'primeng/api';
import { ProveedorApiService } from '../services/proveedor.api.service';
import { NgTemplateOutlet } from '@angular/common';
import { ProveedorResponseDto } from '../services/dtos/proveedor.response.dto';
import { StatusBinaryReadOnlyComponent } from '../../../../shared/components/status-binary-read-only/status-binary-read-only.component';
import { alreadyTakenUpdate } from '@core/common/already-taken.validator';
import { Router, ActivatedRoute } from '@angular/router';
import { AppSharedModule } from '@shared/app-shared.module';
import { HeaderComponent } from '@shared/components/header/header.component';
import { DropdownModel } from '@shared/interface/dropdown.model';
import { TipoProveedorApiService } from '../../tipo-proveedor/services/tipo-proveedor.api.service';
import { ProveedorCreateDto } from '../services/dtos/proveedor.create.dto';
import { ProveedorUpdateDto } from '../services/dtos/proveedor.update.dto';
import { CommonService } from '@shared/services/common.service';

@Component({
  selector: 'app-editar',
  imports: [
    AppPrimengModule, 
    ReactiveFormsModule, 
    MessageErrorComponent,  
    NgTemplateOutlet,
    HeaderComponent,
    AppSharedModule
  ],
  templateUrl: './editar.component.html',
  styleUrl: './editar.component.scss',
})
export class EditarComponent {
  display = true;
  proveedorApiService = inject(ProveedorApiService);
  tipoProveedorApiService = inject(TipoProveedorApiService);
    commonService = inject(CommonService)

  fb = inject(FormBuilder);
  formulario = this.fb.group({
    id:[''],
    nombreComercial: ['', [Validators.required]],
    // nombreComercial: ['', [Validators.required],[alreadyTaken(this.proveedorApiService,'?nombreComercial=')]],
    tipoContribuyente: [''],
    idsTipoProveedor: [<string[]>[], [Validators.required]],
    condicionPago: ['', [Validators.required]],
    correo: ['', [Validators.required]],
    telefono: ['', [Validators.required]],
    razonSocial:[''],
    rfc:[''],
    cp:[''],
    tipoVialidad:[''],
    nombreVialidad:[''],
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

  constructor(){
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      console.log('id',id);

      if (id) {
        this.formulario.patchValue({id:id})
        this.cargarDatos(this.formulario.getRawValue().id as string);

      }

    })
  }

  cargarDatos(id:string){
    this.proveedorApiService.getOne(id).subscribe((resp)=>{
      console.log(resp);

      this.formulario.patchValue({
        nombreComercial:resp.nombreComercial,
        idsTipoProveedor: resp.tiposProveedor?.map(tipo => tipo.id) ?? (resp.idTipoProveedor ? [resp.idTipoProveedor] : []),
        condicionPago:resp.condicionPago?.toUpperCase(),
        correo:resp.correo,
        telefono:resp.telefono,
        tipoContribuyente:resp.infoFiscal.tipoContribuyente.toUpperCase(),
        razonSocial:resp.infoFiscal.razonSocial,
        rfc:resp.infoFiscal.rfc,
        cp:resp.infoFiscal.codigoPostal,
        tipoVialidad:resp.infoFiscal.tipoVialidad,
        nombreVialidad:resp.infoFiscal.nombreVialidad,
        numExt:resp.infoFiscal.numeroExterior,
        numInt:resp.infoFiscal.numeroInterior,
        colonia:resp.infoFiscal.colonia,
        localidad:resp.infoFiscal.localidad,
        municipio:resp.infoFiscal.municipio,
        entidadFederativa:resp.infoFiscal.entidadFederativa,
        entreCalle:resp.infoFiscal.calle1,
        calle:resp.infoFiscal.calle2
        

      
        })

        console.log(this.formulario);

      })
      
    }
  


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

    const request:ProveedorUpdateDto = {
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
        tipoContribuyente:formValue.tipoContribuyente as string
      }

    }

    this.proveedorApiService.update(request,this.formulario.getRawValue().id as string).subscribe((resp)=>{
      console.log(resp);
        this.formulario.reset();
        this.router.navigate(['../../'], { relativeTo: this.route });
        this.messageService.clear();
        this.messageService.add({
          key: 'top-right',
          severity: 'success',
          summary: '¡Actualización exitosa!',
          detail: 'Se ha actualizado el proveedor',
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
