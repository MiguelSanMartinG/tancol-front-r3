import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AppPrimengModule } from '@shared/app-primeng/app-primeng.module';
import { BotonRegresarComponent } from '@shared/components/boton-regresar/boton-regresar.component';
import { HeaderComponent } from '@shared/components/header/header.component';
import { StatusBinaryReadOnlyComponent } from '@shared/components/status-binary-read-only/status-binary-read-only.component';
import { DatetimePipe } from '@shared/pipes/datetime.pipe';
import { RegistrarComponent } from '../../departamento/registrar/registrar.component';
import { RutasApiService } from '../services/rutas-api.service';
import { RutasResponse } from '../services/rutas.response';
import { EliminarComponent } from '../eliminar/eliminar.component';
import { EmpleadoApiService } from '../../empleados/services/empleado.api.service';
import { getEmpleadoNombreCompleto } from '../../empleados/services/dtos/empleado.response';
// import { EliminarComponent } from '../eliminar/eliminar.component';

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
        DatetimePipe,
        StatusBinaryReadOnlyComponent,
        EliminarComponent
  ],
  styleUrl: './principal.component.scss',

})
export class PrincipalComponent {
  // @HostBinding('class') protected readonly class = 'contents'; // Makes component host as if it was not there, can offer less css headaches. Assumes .contents{display:contents} css class exits
  update = false;
  rutasService = inject(RutasApiService);
  empleadoApiService = inject(EmpleadoApiService);
  private empleadosMap = signal(new Map<string, string>());
   @ViewChild(EliminarComponent) eliminarComponent!: EliminarComponent;

  constructor(
    private router:Router,
    private route: ActivatedRoute
  ){}

    listaRegistros = computed( ()=> {
      if(this.rutasService.listAll().length > 0){
        console.log('---',this.rutasService.listAll);
        return [...this.rutasService.listAll().map( row => (
          
          {
          ...row,
          choferNombreCompleto: this.empleadosMap().get(row.choferBase?.idEmpleado) ?? row.choferBase?.nombre ?? '',
          fechaModificacion: (row.updatedAt)?row.updatedAt:row.cratedAt
          // createdAt:  new Date(row.createdAt),
          // updatedAt: (row.updatedAt != null)?new Date(row.updatedAt):new Date(row.createdAt)
        }))].sort((a, b) => {
          const numA = parseInt(a.numero, 10) || 0;
          const numB = parseInt(b.numero, 10) || 0;
          return numA - numB;
        })
      }
      return [];
    });

  getAyudantes(empleadosAsignados: any[]): string {
    if (!empleadosAsignados || empleadosAsignados.length === 0) return 'N/A';
    return empleadosAsignados
      .map(emp => this.empleadosMap().get(emp.idEmpleado) ?? emp.nombre ?? '')
      .filter(name => name)
      .join(', ');
  }

  ngOnInit(): void {
    this.empleadoApiService.getAllFilter('?enabled=true').subscribe((resp) => {
      this.empleadosMap.set(new Map(
        resp.map((empleado) => [empleado.idEmpleado, getEmpleadoNombreCompleto(empleado)])
      ));
    });
    this.rutasService.getAll().subscribe();
  }
  displayUpdate(itemDto: any) {
    this.router.navigate(['../actualizar/',itemDto.id], { relativeTo: this.route });

  }
  displayDelete(itemDto: any) {
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

}
