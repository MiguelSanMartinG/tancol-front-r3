import { NgTemplateOutlet } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AppPrimengModule } from '@shared/app-primeng/app-primeng.module';
import { ProveedorApiService } from '../../proveedor/services/proveedor.api.service';
import { MessageService } from 'primeng/api';
import { alreadyTaken } from '@core/common/already-taken.validator';
import { HeaderComponent } from '@shared/components/header/header.component';
import { ActivatedRoute, Router } from '@angular/router';
import { AppSharedModule } from '@shared/app-shared.module';
import { FormComponent } from '../form/form.component';
import { RutasApiService } from '../services/rutas-api.service';
import { RutasDTO, TipoRuta } from '../services/rutas-dto';

@Component({
  selector: 'app-registrar',
  imports: [
    AppPrimengModule, 
    ReactiveFormsModule, 
    HeaderComponent,
    AppSharedModule,
    FormComponent

  ],
  templateUrl: './registrar.component.html',
  styleUrl: './registrar.component.scss',
})
export class RegistrarComponent {
  rutasApiService = inject(RutasApiService);
  fb = inject(FormBuilder);
    router = inject(Router);
    route = inject(ActivatedRoute);
  
  formulario = this.fb.group({
    nombre: ['', [Validators.required], [alreadyTaken(this.rutasApiService, '?nombre=')]],
    numero: ['', [Validators.required]],
    letraPredeterminada: ['', [Validators.required]],
    idChofer: ['', [Validators.required]],
    empleadosAsignados: [[]],
    idVehiculo: ['', [Validators.required]],
    idProductoC: ['', [Validators.required]],
    tipoRuta: [null, [Validators.required]],
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
      enabled: true
    }
    

    this.rutasApiService.create(request)
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
          detail: 'Se ha registrado la ruta',
        });
      });
  }
  handleHide(){
    this.formulario.reset();
  }

}
