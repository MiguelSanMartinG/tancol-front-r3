import { BotonCancelarComponent } from '@shared/components/boton-cancelar/boton-cancelar.component';
import { Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { alreadyTaken } from '@core/common/already-taken.validator';
import { MessageService } from 'primeng/api';
import { AppPrimengModule } from '@shared/app-primeng/app-primeng.module';
import { MessageErrorComponent } from '@shared/components/message-error/message-error.component';
import { NgTemplateOutlet } from '@angular/common';
import { HeaderComponent } from '@shared/components/header/header.component';
import { AppSharedModule } from '@shared/app-shared.module';
import { DepartamentoApiService } from '../services/departamento.api.service';
import { AlmacenApiService } from '../../almacen/services/almacen.api.service';
import { AlmacenResponseDto } from '../../almacen/services/dtos/almacen.response.dto';
import { StatusBinaryReadOnlyComponent } from '@shared/components/status-binary-read-only/status-binary-read-only.component';

@Component({
  selector: 'app-editar',
  templateUrl: './editar.component.html',
  imports: [BotonCancelarComponent, 
      AppPrimengModule, 
      ReactiveFormsModule, 
      MessageErrorComponent,  
      NgTemplateOutlet,
      HeaderComponent,
      AppSharedModule,
      StatusBinaryReadOnlyComponent
    ],
  // styles: [':host{display:contents}'], // Makes component host as if it was not there, can offer less css headaches. Use @HostBinding class approach for easier overrides.
  // host: { class: 'contents' },
})
export class EditarComponent {
    DepartamentoApiService = inject(DepartamentoApiService);
    fb = inject(FormBuilder);
    router = inject(Router);
    route = inject(ActivatedRoute);
    formulario = this.fb.group({
      nombre: ['', [Validators.required],[alreadyTaken(this.DepartamentoApiService,'?nombre=')]],
      alias: ['', [Validators.required]],
      desc:[''],
      status: [false],
      id: ['', [Validators.required]],
      idAlmacen: [null as string | null],
    });
    messageService = inject(MessageService);
    private readonly almacenApi = inject(AlmacenApiService);
    private readonly todos = signal<AlmacenResponseDto[]>([]);
    private readonly idAsignado = signal<string | null>(null);
    /** Almacenes activos, más el ya asignado aunque esté inactivo. */
    readonly almacenes = computed(() => this.todos().filter((a) => a.status || a.id === this.idAsignado()));

    constructor(){
      this.almacenApi.getAll().subscribe((lista) => this.todos.set(lista));
      this.route.paramMap.subscribe(params => {
        const id = params.get('id');
        console.log('id',id);

        if (id) {
          this.cargarDatos(id);
        }

      })

    }

    cargarDatos(id:string){
      this.DepartamentoApiService.getOne(id).subscribe((resp)=>{
        console.log(resp);

        this.idAsignado.set(resp.idAlmacen ?? null);
        this.formulario.patchValue({
          idAlmacen: resp.idAlmacen ?? null,
          nombre:resp.nombre,
          alias:resp.alias,
          desc:resp.descripcion,
          status: resp.status,
          id:id
        })
        
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
      this.DepartamentoApiService.update({
          nombre: this.formulario.getRawValue().nombre!,
          alias: this.formulario.getRawValue().alias!,
          descripcion:this.formulario.getRawValue().desc!,
          estado: this.formulario.getRawValue().status!,
          idAlmacen: this.formulario.getRawValue().idAlmacen,
        },this.formulario.getRawValue()['id'] as string)
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
            detail: 'Se ha actualizado el departamento',
          });
        });
    }
    handleHide(){
      this.formulario.reset();
    }
}
