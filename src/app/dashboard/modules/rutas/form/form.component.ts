import { CommonModule } from '@angular/common';
import { Component, DoCheck, computed, inject, Input, OnInit, Signal } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { SelectModel } from '@core/common/select.model';
import { AppPrimengModule } from '@shared/app-primeng/app-primeng.module';
import { AppSharedModule } from '@shared/app-shared.module';
import { MessageErrorComponent } from '@shared/components/message-error/message-error.component';
import { DropdownModel } from '@shared/interface/dropdown.model';
import { TipoClienteApiService } from '../../tipo-cliente/services/tipo-cliente.api.service';
import { EmpleadoApiService } from '../../empleados/services/empleado.api.service';
import { VehiculosApiService } from '../../vehiculos/services/vehiculos-api.service';
import { NuestrosProductosService } from '../../nuestros-productos/service/nuestros-productos.service';
import { EmpleadoResponseDto, getEmpleadoNombreCompleto } from '../../empleados/services/dtos/empleado.response';
import { signal } from '@angular/core';
import { TipoRuta } from '../services/rutas-dto';

@Component({
  selector: 'app-form',
  templateUrl: './form.component.html',
  imports:[
    MessageErrorComponent,
    ReactiveFormsModule,
    CommonModule,
    AppSharedModule,
    AppPrimengModule,

      
  ]
  // styles: [':host{display:contents}'], // Makes component host as if it was not there, can offer less css headaches. Use @HostBinding class approach for easier overrides.
  // host: { class: 'contents' },
})
export class FormComponent implements OnInit, DoCheck {

  @Input() formulario!:FormGroup;
  // departamentoApiService = inject(DepartamentoApiService)
  tipoCliente = inject(TipoClienteApiService);
  vehiculoApi = inject(VehiculosApiService);
  productoApi = inject(NuestrosProductosService);
  empleadoApi = inject(EmpleadoApiService);
  private empleadosExtra = signal<EmpleadoResponseDto[]>([]);
  private selectedEmployeesSignature = '';

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
    condicionPago:DropdownModel[] = [
      {
        name:'Contado',
        code:'CONTADO'
      },
      {
        name:'Crédito',
        code:'CREDITO'
      } 
    ]

  tipoRutaOptions: { label: string; value: TipoRuta | null; disabled?: boolean }[] = [
    { label: 'Selecciona', value: null, disabled: true },
    { label: 'RP', value: 'RP' },
    { label: 'RC', value: 'RC' },
    { label: 'RH', value: 'RH' },
    { label: 'AUTO_P1', value: 'AUTO_P1' },
    { label: 'AUTO', value: 'AUTO' },
    { label: 'AUTO_P4', value: 'AUTO_P4' },
    { label: 'AUTO_PD', value: 'AUTO_PD' },
  ];

listaChoferSeleccionar: Signal<SelectModel[]> = computed(() => {
  return this.getMergedEmployees()
    .map((empleado:EmpleadoResponseDto) => ({
        label: getEmpleadoNombreCompleto(empleado),
        value: empleado.idEmpleado,
        disabled: !empleado.enabled,
      }))
});

listaAyudanteSeleccionar: Signal<SelectModel[]> = computed(() => {
  return this.getMergedEmployees()
    .map((empleado:EmpleadoResponseDto) => ({
        label: getEmpleadoNombreCompleto(empleado),
        value: empleado.idEmpleado,
        disabled: !empleado.enabled,
      }))
});
  listaVehiculoSeleccionar: Signal<SelectModel[]> = computed(() => {
    return this.vehiculoApi.listAll().map((row) => ({
      label: row.nombre,
      value: row.id,
    }));
  });

  listaProductoSeleccionar: Signal<SelectModel[]> = computed(() => {
    return this.productoApi.listAll().map((row) => ({
      label: row.nombre,
      value: row.idProductoComercial,
    }));
  });

  listaTipoClienteSelecccionar: Signal<SelectModel[]> = computed(() => {
    if (this.tipoCliente.listAll().length > 0) {
      return this.tipoCliente.listAll().map((row) => ({
        label: row.nombre,
        value: row.idTiposClientes,
      }));
    } else {
      return [];
    }
  });

    ngOnInit(): void {
      this.empleadoApi.getAllFilter('?enabled=true').subscribe();
      this.vehiculoApi.getAllFilter('?status=DISPONIBLE').subscribe();
      this.productoApi.getAllFilter('?enabled=true').subscribe();
    }

    ngDoCheck(): void {
      const nextSignature = JSON.stringify({
        chofer: this.formulario?.get('idChofer')?.value ?? '',
        ayudantes: this.formulario?.get('empleadosAsignados')?.value ?? [],
      });

      if (nextSignature !== this.selectedEmployeesSignature) {
        this.selectedEmployeesSignature = nextSignature;
        this.loadMissingSelectedEmployees();
      }
    }

    getChoferOptions(): SelectModel[] {
      const selectedId = String(this.formulario?.get('idChofer')?.value ?? '');
      return this.listaChoferSeleccionar().map((option) =>
        option.value === selectedId ? { ...option, disabled: false } : option
      );
    }

    getAyudanteOptions(): SelectModel[] {
      const selectedIds = new Set<string>(
        (this.formulario?.get('empleadosAsignados')?.value ?? []).map((id: string) => String(id))
      );

      return this.listaAyudanteSeleccionar().map((option) =>
        selectedIds.has(option.value) ? { ...option, disabled: false } : option
      );
    }

    private getMergedEmployees(): EmpleadoResponseDto[] {
      const map = new Map<string, EmpleadoResponseDto>();
      for (const empleado of this.empleadoApi.listAll()) {
        map.set(empleado.idEmpleado, empleado);
      }
      for (const empleado of this.empleadosExtra()) {
        map.set(empleado.idEmpleado, empleado);
      }
      return Array.from(map.values());
    }

    private loadMissingSelectedEmployees(): void {
      const selectedIds = [
        this.formulario?.get('idChofer')?.value,
        ...((this.formulario?.get('empleadosAsignados')?.value ?? []) as string[]),
      ]
        .filter((id): id is string => !!id)
        .map((id) => String(id));

      const existingIds = new Set(this.getMergedEmployees().map((empleado) => empleado.idEmpleado));

      for (const id of selectedIds) {
        if (existingIds.has(id)) {
          continue;
        }

        existingIds.add(id);
        this.empleadoApi.getOne(id).subscribe((empleado) => {
          this.empleadosExtra.update((list) =>
            list.some((item) => item.idEmpleado === empleado.idEmpleado)
              ? list
              : [...list, empleado]
          );
        });
      }
    }
  // @HostBinding('class') protected readonly class = 'contents'; // Makes component host as if it was not there, can offer less css headaches. Assumes .contents{display:contents} css class exits
  // constructor() {}
}
