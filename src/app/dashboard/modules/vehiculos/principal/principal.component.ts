import { CommonModule } from '@angular/common';
import { Component, computed, inject, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AppPrimengModule } from '@shared/app-primeng/app-primeng.module';
import { BotonRegresarComponent } from '@shared/components/boton-regresar/boton-regresar.component';
import { HeaderComponent } from '@shared/components/header/header.component';
import { StatusBinaryReadOnlyComponent } from '@shared/components/status-binary-read-only/status-binary-read-only.component';
import { DatetimePipe } from '@shared/pipes/datetime.pipe';
import { RegistrarComponent } from '../../departamento/registrar/registrar.component';
import { VehiculosApiService } from '../services/vehiculos-api.service';
import { VehiculosResponse } from '../services/vehiculos.response';
import { EliminarComponent } from '../eliminar/eliminar.component';

@Component({
  selector: 'app-principal',
  templateUrl: './principal.component.html',
  // styles: [':host{display:contents}'], // Makes component host as if it was not there, can offer less css headaches. Use @HostBinding class approach for easier overrides.
  // host: { class: 'contents' },
  imports: [
    CommonModule,
        BotonRegresarComponent,
        HeaderComponent,
        AppPrimengModule,
        RegistrarComponent,
        // RegistrarTipoImpuestoComponent,
        // EditarComponent,
        DatetimePipe,
        StatusBinaryReadOnlyComponent,
        EliminarComponent
  ],
  styleUrl: './principal.component.scss',

})
export class PrincipalComponent {
  // @HostBinding('class') protected readonly class = 'contents'; // Makes component host as if it was not there, can offer less css headaches. Assumes .contents{display:contents} css class exits
  update = false;
  tipoClienteService = inject(VehiculosApiService);
   @ViewChild(EliminarComponent) eliminarComponent!: EliminarComponent;

  constructor(
    private router:Router,
    private route: ActivatedRoute
  ){}

    listaRegistros = computed( ()=> {
      if(this.tipoClienteService.listAll().length > 0){
        console.log('---',this.tipoClienteService.listAll);
        return [...this.tipoClienteService.listAll().map( row => (
          
          {
          ...row,
          fechaModificacion: (row.updatedAt)?row.updatedAt:row.cratedAt
          // createdAt:  new Date(row.createdAt),
          // updatedAt: (row.updatedAt != null)?new Date(row.updatedAt):new Date(row.createdAt)
        }))]
      }
      return [];
    })
  ngOnInit(): void {
    this.tipoClienteService.getAll().subscribe();
  }
  displayUpdate(itemDto: VehiculosResponse) {
    this.router.navigate(['../actualizar/',itemDto.id], { relativeTo: this.route });

  }
  displayDelete(itemDto: VehiculosResponse) {
    this.eliminarComponent.itemDto.set({
      ...itemDto
    });
    this.eliminarComponent.display = true;
  }
  displayCreate() {
    this.router.navigate(['../crear'], { relativeTo: this.route });

  }
  searchTable(tableComponent: any, $event: any){
    tableComponent.filterGlobal($event.target!.value ?? '', 'contains')
  }

  transformarEstado(estado: string): string {
  switch (estado) {
    case 'DISPONIBLE':
      return 'Disponible';
    case 'EN_TALLER':
      return 'En taller';
    case 'FUERA_DE_SERVICIO':
      return 'Fuera de servicio';
    default:
      return estado;
  }
}

getEstadoClase(estado: string): string {
  switch (estado) {
    case 'DISPONIBLE':
      return 'bg-green-100 text-green-800';
    case 'EN_TALLER':
      return 'bg-yellow-100 text-yellow-800';
    case 'FUERA_DE_SERVICIO':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

}
