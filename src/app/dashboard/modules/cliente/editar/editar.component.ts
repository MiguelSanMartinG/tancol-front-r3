import { Component, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { alreadyTaken } from '@core/common/already-taken.validator';
import { MessageService } from 'primeng/api';
import { AppPrimengModule } from '@shared/app-primeng/app-primeng.module';
import { MessageErrorComponent } from '@shared/components/message-error/message-error.component';
import { NgTemplateOutlet } from '@angular/common';
import { HeaderComponent } from '@shared/components/header/header.component';
import { AppSharedModule } from '@shared/app-shared.module';
import { FormComponent } from '../form/form.component';
import { ClienteApiService } from '../services/cliente.service';
import { ClienteDTO } from '../services/cliente.dto';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-editar',
  templateUrl: './editar.component.html',
  imports: [
      AppPrimengModule, 
      ReactiveFormsModule, 
      MessageErrorComponent,  
      NgTemplateOutlet,
      HeaderComponent,
      AppSharedModule,
      FormComponent
    ],
})
export class EditarComponent {
    clienteApiService = inject(ClienteApiService);
    fb = inject(FormBuilder);
    router = inject(Router);
  route = inject(ActivatedRoute);
  readonly = false;
  nombreComercialAnterior = '-';
  razonSocialAnterior = '-';
  formulario = this.fb.group({
    nombre: ['', [Validators.required],[]],
    tipoContribuyente: ['', ],
    comentario:[''],
    tipoCliente: ['', [Validators.required]],
    condicionPago: ['', [Validators.required]],
    diasCredito:[''],
    correo: [''],
    ruta:['',[]],
    telefono: [''],
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
    calle:['', []],
    id:['', []]

  });
    messageService = inject(MessageService);
    
  constructor(){
      this.route.queryParamMap.subscribe((params) => {
        this.readonly = params.get('readonly') === 'true' || params.get('readonly') === '1';
      });

      this.route.paramMap.subscribe(params => {
        const id = params.get('id');
        console.log('id',id);
        if (id) {
          this.cargarDatos(id);
        }
      })
    }

    cargarDatos(id:string){
    this.clienteApiService.getOne(id).subscribe((resp)=>{
      forkJoin({
        historialNombre: this.clienteApiService.getUltimoNombreComercial(id),
        historialRazon: this.clienteApiService.getUltimaRazonSocial(id),
      }).subscribe(({ historialNombre, historialRazon }) => {
        this.nombreComercialAnterior = historialNombre || '-';
        this.razonSocialAnterior = historialRazon || '-';
      });

      this.formulario.patchValue({
        nombre:resp.nombreComercial,
        tipoContribuyente: resp.tipoContribuyente,
        ruta:resp.rutaAsociada?.id,
        tipoCliente: resp.tipoDeCliente.idTipoCliente,
        condicionPago: resp.tipoPago,
        diasCredito: resp.diasDeCredito?.toString(),
        correo: resp.correo,
        telefono: resp.telefono,
        clienteDesde:<any> new Date(resp.fechaAlta),
        tipoContribuyenteInfofiscal: resp.informacionFiscal?.tipoContribuyente,
        razonSocial:resp.informacionFiscal?.razonSocial,
        rfc:resp.informacionFiscal?.rfc,
        cp:resp.informacionFiscal?.codigoPostal,
        tipoVialidad:resp.informacionFiscal?.tipoVialidad,
        nombreVialidad:resp.informacionFiscal?.nombreVialidad,
        numExt:resp.informacionFiscal?.numeroExterior,
        numInt:resp.informacionFiscal?.numeroInterior,
        colonia:resp.informacionFiscal?.colonia,
        localidad:resp.informacionFiscal?.localidad,
        municipio:resp.informacionFiscal?.municipio,
        entidadFederativa:resp.informacionFiscal?.entidadFederativa,
        entreCalle:resp.informacionFiscal?.calle1,
        calle:resp.informacionFiscal?.calle2,
        id:id
      });

      if (this.readonly) {
        this.formulario.disable({ emitEvent: false });
      }

      })
    }

    validarRegistros() {
      console.log(this.formulario);
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
      diasDeCredito:(formValue.diasCredito != '')?parseFloat(formValue.diasCredito!):0,
      fechaAlta: formValue.clienteDesde!,
      nombreComercial: formValue.nombre!,
      telefono: formValue.telefono!,
      idTipoDeCliente: formValue.tipoCliente!,
      // tipoContribuyente: formValue.tipoContribuyente!,
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

      console.log(request)
      this.clienteApiService.update(request,formValue.id!).subscribe((resp) => {
// this.display = false;
this.formulario.reset();
this.messageService.clear();
this.router.navigate(['../../'], { relativeTo: this.route });
this.messageService.add({
  key: 'top-right',
  severity: 'success',
  summary: '¡Actualización exitosa!',
  detail: 'Se ha actualizado el empleado',
});
      });
    }
    handleHide(){
      this.formulario.reset();
    }

      passwordsIgualesValidator(form: FormGroup): ValidationErrors | null {
        const password = form.get('pass')?.value;
        const confirmPassword = form.get('confirmPassword')?.value;
      
        return password === confirmPassword ? null : { passwordMismatch: true };
      }
}
