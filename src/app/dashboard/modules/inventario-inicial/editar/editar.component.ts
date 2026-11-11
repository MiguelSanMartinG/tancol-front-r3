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
import { ClienteApiService } from '../../cliente/services/cliente.service';
import { InventarioInicialService } from '../services/inventario-inicial.service';
import { InventarioInicialDTO } from '../services/inventario-inicial.dto';

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
  // styles: [':host{display:contents}'], // Makes component host as if it was not there, can offer less css headaches. Use @HostBinding class approach for easier overrides.
  // host: { class: 'contents' },
})
export class EditarComponent {
    fb = inject(FormBuilder);
    router = inject(Router);
    route = inject(ActivatedRoute);
  formulario = this.fb.group({
    almacen: ['', [Validators.required],[]],
    producto:['',[Validators.required]],
    cantidad:[0,Validators.required],
    unidadMedida:['',Validators.required],
    id:['',Validators.required],
        proveedor:[''],
    precio:['']
  });
    inventarioInicialApiService = inject(InventarioInicialService);
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
      this.inventarioInicialApiService.getOne(id).subscribe((resp)=>{
        console.log(resp);
        this.formulario.patchValue({
          almacen:resp.almacen?.idAlmacen,
          cantidad:resp.cantidad,
          producto:resp.producto?.idProducto,
          unidadMedida:resp.unidadesMedida?.idUnidadDeMedida,
          id:resp.idInventario
        })
    //     this.formulario.patchValue({
    //       nombre:resp.nombreComercial,
    //       tipoContribuyente: resp.tipoContribuyente,
    // tipoCliente: resp.tipoDeCliente.idTipoCliente,
    // condicionPago: resp.tipoPago,
    // correo: resp.correo,
    // telefono: resp.telefono,
    // clienteDesde:<any> new Date(resp.fechaAlta),
    // tipoContribuyenteInfofiscal: resp.informacionFiscal.tipoContribuyente,
    // razonSocial:resp.informacionFiscal.razonSocial,
    // rfc:resp.informacionFiscal.rfc,
    // cp:resp.informacionFiscal.codigoPostal,
    // tipoVialidad:resp.informacionFiscal.tipoVialidad,
    // nombreVialidad:resp.informacionFiscal.nombreVialidad,
    // numExt:resp.informacionFiscal.numeroExterior,
    // numInt:resp.informacionFiscal.numeroInterior,
    // colonia:resp.informacionFiscal.colonia,
    // localidad:resp.informacionFiscal.localidad,
    // municipio:resp.informacionFiscal.municipio,
    // entidadFederativa:resp.informacionFiscal.entidadFederativa,
    // entreCalle:resp.informacionFiscal.calle1,
    // calle:resp.informacionFiscal.calle2,
    //       id:id
    //     })
        
      })
    }

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
          let request:InventarioInicialDTO = {
      cantidad:formValue.cantidad!,
      idAlmacen:formValue.almacen!,
      idProducto:formValue.producto!,
      unidadDeMedida:formValue.unidadMedida!,
            idProveedor:formValue.proveedor!,
      precioProveedor:parseFloat(formValue.precio!),
    }


    this.inventarioInicialApiService.update(request,formValue.id!)
      .subscribe((resp) => {
        console.log(resp);
        // this.display = false;
        this.formulario.reset();
        this.messageService.clear();
        this.router.navigate(['../../'], { relativeTo: this.route });
        this.messageService.add({
          key: 'top-right',
          severity: 'success',
          summary: '¡Actualización exitosa!',
          detail: 'Se ha Actualizado el inventario',
        });
      });
    // let request:InventarioInicialDTO = {

    // }

      // console.log(request)
//       this.inventarioInicialApiService.update(request,formValue.id!).subscribe((resp) => {
// this.formulario.reset();
// this.messageService.clear();
// this.router.navigate(['../../'], { relativeTo: this.route });
// this.messageService.add({
//   key: 'top-right',
//   severity: 'success',
//   summary: '¡Actualización exitosa!',
//   detail: 'Se ha actualizado el empleado',
// });
//       });


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
