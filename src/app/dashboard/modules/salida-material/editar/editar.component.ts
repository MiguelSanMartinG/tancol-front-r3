import { BotonRegresarComponent } from '@shared/components/boton-regresar/boton-regresar.component';
import { BotonCancelarComponent } from '@shared/components/boton-cancelar/boton-cancelar.component';
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
import { FormComponent, SalidaMaterialPartida } from '../form/form.component';
import { SalidaMaterialApiService } from '../service/salida-material.service';
import { LocalStorageService } from '@shared/services/local-storage.service';
import { UploadFileApiService } from '@shared/services/upload-file.api.service';
import { finalize, switchMap, throwError } from 'rxjs';


@Component({
  selector: 'app-editar',
  templateUrl: './editar.component.html',
  imports: [BotonRegresarComponent, BotonCancelarComponent, 
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
    salidaMaterialApiService = inject(SalidaMaterialApiService);
    fb = inject(FormBuilder);
    router = inject(Router);
    route = inject(ActivatedRoute);
  localStorage = inject(LocalStorageService)

    formulario = this.fb.group({
  folio: [{value:'',disabled:true}],
  comentarios: [{value:'',disabled:true}],
  // Se llena con quien entregó la salida (empleadoEmisor del back), no con el usuario en sesión.
  empleadoEmisor: [{value:'',disabled:true}, Validators.required],
  idempleadoEmisor: [{value:'',disabled:true}, Validators.required],
  empleadoReceptor: [{value:'',disabled:true}, Validators.required],
  estado: ['EN USO'],
  fechaElaboracion: [{value:new Date(),disabled:true},Validators.required],
  uso: [{value:'',disabled:true}],
  // partidas: this.fb.array([
  //   this.fb.group({
  //     cantidad: [0],
  //     comentarioPartida: [''],
  //     idAlmacen: [''],
  //     idProductoBasico: [''],
  //     unidadMedida: ['']
  //   })
  // ])
});
    messageService = inject(MessageService);
    listaPartidas: SalidaMaterialPartida[] = [];
    uploadFileApi = inject(UploadFileApiService);
    idSalida: string | null = null;
    idImagenFirmaRecibe: string | null = null;
    fechaFirmaRecibe: string | null = null;
    firmandoRecibe = false;

    /** Firma de quien recibe para una salida ya guardada sin firma: sube la imagen y llama al PATCH. */
    firmarRecibe(file: File) {
      const id = this.idSalida;
      if (!id || this.firmandoRecibe) return;
      this.firmandoRecibe = true;
      this.uploadFileApi.create(file).pipe(
        switchMap((resp) => {
          if (!resp?.fileName) {
            return throwError(() => ({ error: { message: 'No se pudo subir la firma de quien recibe.' } }));
          }
          return this.salidaMaterialApiService.firmarRecibe(id, { idImagenFirmaRecibe: resp.fileName });
        }),
        finalize(() => (this.firmandoRecibe = false))
      ).subscribe({
        next: () => {
          this.messageService.add({
            key: 'center',
            severity: 'success',
            summary: '¡Firma registrada!',
            detail: 'Se guardó la firma de quien recibe.',
          });
          this.cargarDatos(id);
        },
        error: (error) => {
          const body = error?.error;
          const detail = typeof body === 'string' ? body : body?.message ?? 'No se pudo guardar la firma de quien recibe.';
          this.messageService.add({
            key: 'center',
            severity: error?.status === 409 ? 'warn' : 'error',
            summary: 'No se pudo firmar',
            detail: String(detail),
          });
          // Si ya estaba firmada (409), se refresca para mostrar la firma existente.
          if (error?.status === 409) this.cargarDatos(id);
        },
      });
    }

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
      this.idSalida = id;
      this.salidaMaterialApiService.getOne(id).subscribe((resp)=>{
        console.log(resp);
        this.idImagenFirmaRecibe = resp.idImagenFirmaRecibe ?? null;
        this.fechaFirmaRecibe = resp.fechaFirmaRecibe ?? null;
        this.formulario.patchValue({
          folio: resp.folio,
          comentarios: resp.comentario,
          empleadoEmisor: resp.empleadoEmisor?.nombre ?? '',
          idempleadoEmisor: resp.empleadoEmisor?.idEmpleado ?? '',
          empleadoReceptor: resp.empleadoReceptor?.idEmpleado ?? '',
          estado: resp.estado,
          fechaElaboracion: new Date(resp.fechaElaboracion),
          uso: resp.uso
        });
        this.listaPartidas = (resp.partidas ?? []).map((partida: any) => ({
          id: partida.idPartida,
          uid: partida.idPartida,
          almacen: partida.almacen
            ? { id: partida.almacen.idAlmacen, nombre: partida.almacen.nombre }
            : null,
          producto: partida.productoBasico
            ? { ...partida.productoBasico, id: partida.productoBasico.idProducto }
            : null,
          listaProducto: [],
          cantidad: partida.cantidadTranspasada,
          unidadMedida: partida.unidadMedida ?? partida.unidadesMedida,
          stock: 0,
          comentario: partida.comentarioPartida ?? '',
        })) as SalidaMaterialPartida[];
      })
    }

    validarRegistros() {
      if (!this.formulario.valid) {
        this.formulario.markAllAsTouched();
        this.messageService.add({
          key: 'center',
          severity: 'warn',
          summary: '¡Precaución!',
          detail: 'Hay campos inválidos o faltan campos por llenar.',
        });
        return;
      }
      const formValue = this.formulario.getRawValue();
      console.log(formValue);
    // let request:ClienteDTO = {
    //   correo: formValue.correo!,
    //   fechaAlta: formValue.clienteDesde!,
    //   nombreComercial: formValue.nombre!,
    //   telefono: formValue.telefono!,
    //   idTipoDeCliente: formValue.tipoCliente!,
    //   tipoContribuyente: formValue.tipoContribuyente!,
    //   tipoPago: formValue.condicionPago!,
    //   informacionFiscal:{
    //     calle1: formValue.calle!,
    //     calle2: formValue.calle!,
    //     codigoPostal: formValue.cp!,
    //     colonia: formValue.colonia!,
    //     entidadFederativa: formValue.entidadFederativa!,
    //     localidad: formValue.localidad!,
    //     municipio: formValue.municipio!,
    //     nombreVialidad: formValue.nombreVialidad!,
    //     numeroExterior: formValue.numExt!,
    //     numeroInterior: formValue.numInt!,
    //     razonSocial: formValue.razonSocial!,
    //     rfc: formValue.rfc!,
    //     tipoContribuyente: formValue.tipoContribuyenteInfofiscal!,
    //     tipoVialidad: formValue.tipoVialidad!,
    //   }
    // }

      // console.log(request)
//       this.clienteApiService.update(request,formValue.id!).subscribe((resp) => {
// // this.display = false;
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

      // this.empleadoApiService.update({
      //     nombre: this.formulario.getRawValue().nombre!,
      //     alias: ''
      //   },this.formulario.getRawValue()['id'] as string)
      //   .subscribe((resp) => {
      //     console.log(resp);
      //     // this.display = false;
      //     this.formulario.reset();
      //     this.messageService.clear();
      //     this.router.navigate(['../../'], { relativeTo: this.route });
      //     this.messageService.add({
      //       key: 'top-right',
      //       severity: 'success',
      //       summary: '¡Actualización exitosa!',
      //       detail: 'Se ha actualizado el tipo de cliente',
      //     });
      //   });
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
