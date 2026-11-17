import { CommonModule } from '@angular/common';
import { Component, computed, DestroyRef, inject, Input, OnInit, Signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { requiereVigencia, TIPOS_CONTRATACION } from '../services/dtos/empleado.create.dto';
import { OBSERVACIONES_MAX } from './datos-laborales';
import { SelectModel } from '@core/common/select.model';
import { AppPrimengModule } from '@shared/app-primeng/app-primeng.module';
import { AppSharedModule } from '@shared/app-shared.module';
import { MessageErrorComponent } from '@shared/components/message-error/message-error.component';
import { TipoEmpleadoApiService } from '../../tipo-empleado/services/tipo-empleado.api.service';
import { DepartamentoApiService } from '../../departamento/services/departamento.api.service';
import { RolApiService } from '../../rol/services/rol.api.service';

@Component({
  selector: 'app-form',
  templateUrl: './form.component.html',
  imports:[
    MessageErrorComponent,
    ReactiveFormsModule,
    CommonModule,
    AppSharedModule,
    AppPrimengModule
      
  ]
  // styles: [':host{display:contents}'], // Makes component host as if it was not there, can offer less css headaches. Use @HostBinding class approach for easier overrides.
  // host: { class: 'contents' },
})
export class FormComponent implements OnInit {

  @Input() formulario!:FormGroup;
  tipoEmpleadoApiService = inject(TipoEmpleadoApiService)
  departamentoApiService = inject(DepartamentoApiService)
  rolApiService = inject(RolApiService)

  listaTipoEmpleadoSelecccionar: Signal<SelectModel[]> = computed(() => {
      if (this.tipoEmpleadoApiService.listAll().length > 0) {
        return this.tipoEmpleadoApiService.listAll().map((row) => ({
          label: row.nombre,
          value: row.idTipoEmpleado,
        }));
      } else {
        return [];
      }
    });

    listaDepartamentoSeleccionar: Signal<SelectModel[]> = computed(() => {
      if (this.departamentoApiService.listDepartamento().length > 0) {
        return this.departamentoApiService.listDepartamento().map((row) => ({
          label: row.nombre,
          value: row.idDepartamento,
        }));
      } else {
        return [];
      }
    });

    listaRolSeleccionar: Signal<SelectModel[]> = computed(() => {
      if (this.rolApiService.listAll().length > 0) {
        return this.rolApiService.listAll().map((row) => ({
          label: row.name,
          value: row.id,
        }));
      } else {
        return [];
      }
    });


    
    // Datos laborales
    private readonly destroyRef = inject(DestroyRef);
    readonly tiposContratacion = TIPOS_CONTRATACION;
    readonly observacionesMax = OBSERVACIONES_MAX;

    ngOnInit(): void {
      this.tipoEmpleadoApiService.getAll().subscribe();
      this.departamentoApiService.getAll().subscribe();
      this.rolApiService.getAll().subscribe();
      this.vincularDatosLaborales();
    }

    /** Muestra la vigencia solo para Temporal / Practicante. */
    requiereVigencia(): boolean {
      return requiereVigencia(this.formulario?.get('tipoContratacion')?.value);
    }

    /** Convierte a mayúsculas (y sin espacios) NSS / RFC / CURP mientras se captura. */
    aMayusculas(nombre: 'nss' | 'rfc' | 'curp'): void {
      const control = this.formulario?.get(nombre);
      if (!control || typeof control.value !== 'string') return;
      const valor = control.value.toUpperCase().replace(/\s+/g, '');
      if (valor !== control.value) control.setValue(valor);
    }

    private vincularDatosLaborales(): void {
      const tipo = this.formulario?.get('tipoContratacion');
      const vigencia = this.formulario?.get('fechaVigencia');
      const ingreso = this.formulario?.get('fechaIngreso');
      const egreso = this.formulario?.get('fechaEgreso');

      if (tipo && vigencia) {
        tipo.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((valor) => {
          if (!requiereVigencia(valor) && vigencia.value !== null) {
            vigencia.setValue(null);
          }
          vigencia.updateValueAndValidity();
        });
      }

      if (ingreso && egreso) {
        ingreso.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
          egreso.updateValueAndValidity();
          if (ingreso.dirty) egreso.markAsTouched();
        });
      }
    }
  // @HostBinding('class') protected readonly class = 'contents'; // Makes component host as if it was not there, can offer less css headaches. Assumes .contents{display:contents} css class exits
  // constructor() {}
}
