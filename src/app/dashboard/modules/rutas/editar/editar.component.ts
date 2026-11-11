import { Component, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { alreadyTaken } from '@core/common/already-taken.validator';
import { MessageService } from 'primeng/api';
import { AppPrimengModule } from '@shared/app-primeng/app-primeng.module';
import { HeaderComponent } from '@shared/components/header/header.component';
import { AppSharedModule } from '@shared/app-shared.module';
import { FormComponent } from '../form/form.component';
import { RutasApiService } from '../services/rutas-api.service';
import { RutasDTO, TipoRuta } from '../services/rutas-dto';


@Component({
  selector: 'app-editar',
  templateUrl: './editar.component.html',
  imports: [
      AppPrimengModule, 
      ReactiveFormsModule, 
      HeaderComponent,
      AppSharedModule,
      FormComponent
    ],
  // styles: [':host{display:contents}'], // Makes component host as if it was not there, can offer less css headaches. Use @HostBinding class approach for easier overrides.
  // host: { class: 'contents' },
})
export class EditarComponent {
    rutaApiService = inject(RutasApiService);
    fb = inject(FormBuilder);
    router = inject(Router);
    route = inject(ActivatedRoute);
  formulario = this.fb.group({
    nombre: ['', [Validators.required], [alreadyTaken(this.rutaApiService, '?nombre=')]],
    numero: ['', [Validators.required]],
    letraPredeterminada: ['', [Validators.required]],
    idChofer: ['', [Validators.required]],
    empleadosAsignados: [[]],
    idVehiculo: ['', [Validators.required]],
    idProductoC: ['', [Validators.required]],
    tipoRuta: [null, [Validators.required]],
    id: ['', [Validators.required]],
    enabled:[false]
  });
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
      this.rutaApiService.getOne(id).subscribe((resp)=>{
        console.log(resp);

        this.formulario.patchValue({
          nombre:resp.nombre,
          numero:resp.numero,
          letraPredeterminada: resp.notaAsignada,
          idChofer: resp.choferBase?.idEmpleado,
          empleadosAsignados: <any> resp.empleadosAsignados?.map((e:any) => e.idEmpleado) || [],
          idVehiculo: resp.vehiculosBase?.id,
          idProductoC: resp.productoBase?.idProductoComercial,
          tipoRuta: resp.tipoRuta as any ?? 'RP',
          id:id,
          enabled: resp.enabled
        })

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
      const tipoRuta = formValue.tipoRuta;
      if (!tipoRuta) {
        this.formulario.get('tipoRuta')?.markAsTouched();
        return;
      }
      console.log(formValue);
    let request:RutasDTO = {
        nombre: formValue.nombre!,
        numero: formValue.numero!,
        letraPredeterminada: formValue.letraPredeterminada!,
        idChofer: formValue.idChofer!,
        empleadosAsignados: formValue.empleadosAsignados!,
        idAyudante: null,
        idVehiculo: formValue.idVehiculo!,
        idProductoC: formValue.idProductoC!,
        tipoRuta: tipoRuta as TipoRuta,
        enabled: formValue.enabled ?? true
      }
    

      console.log(request)
      this.rutaApiService.update(request,formValue.id!).subscribe((resp) => {
// this.display = false;
this.formulario.reset();
this.messageService.clear();
this.router.navigate(['../../'], { relativeTo: this.route });
this.messageService.add({
  key: 'top-right',
  severity: 'success',
  summary: '¡Actualización exitosa!',
  detail: 'Se ha actualizado la ruta',
});
      });

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
