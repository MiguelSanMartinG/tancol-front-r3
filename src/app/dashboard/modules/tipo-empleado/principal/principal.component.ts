import {
  Component,
  computed,
  ContentChild,
  ContentChildren,
  inject,
  OnInit,
  signal,
  ViewChild,
} from '@angular/core';
import { AppPrimengModule } from '@shared/app-primeng/app-primeng.module';
import { BotonRegresarComponent } from '@shared/components/boton-regresar/boton-regresar.component';
import { HeaderComponent } from '@shared/components/header/header.component';
import { DatetimePipe } from '@shared/pipes/datetime.pipe';
import { StatusBinaryReadOnlyComponent } from '@shared/components/status-binary-read-only/status-binary-read-only.component';
import { RegistrarComponent } from '../registrar/registrar.component';
import { ActivatedRoute, Router } from '@angular/router';
import { EliminarComponent } from '../eliminar/eliminar.component';
import { TipoEmpleadoApiService } from '../services/tipo-empleado.api.service';
import { TipoEmpleadoResponse } from '../services/dtos/tipo-empleado.response';
import { CommonModule } from '@angular/common';
import { DateTimeFormatService } from '@shared/services/date-time-format.service';

@Component({
  selector: 'app-principal',
  imports: [
    BotonRegresarComponent,
    HeaderComponent,
    AppPrimengModule,
    RegistrarComponent,
    CommonModule,
    // RegistrarTipoImpuestoComponent,
    // EditarComponent,
    DatetimePipe,
    StatusBinaryReadOnlyComponent,
    EliminarComponent
  ],
  templateUrl: './principal.component.html',
  styleUrl: './principal.component.scss',
})


export class PrincipalComponent implements OnInit {
  update = false;
  tipoEmpleadoApiService = inject(TipoEmpleadoApiService);
  @ViewChild(EliminarComponent) eliminarComponent!: EliminarComponent;

  constructor(
    private router:Router,
    private route: ActivatedRoute,
    private dateTimeFormatService: DateTimeFormatService
  ){}

  listaRegistros = computed(() => {
    if (this.tipoEmpleadoApiService.listAll().length > 0) {
      return [
        ...this.tipoEmpleadoApiService.listAll().map((row) => ({
          ...row,
          createdAt: new Date(row.createdAt),
          updatedAt: row.updatedAt != null ? new Date(row.updatedAt) : new Date(row.createdAt),
          createdAtStr: this.dateTimeFormatService.format(row.createdAt),
          updatedAtStr: this.dateTimeFormatService.format(row.updatedAt ? row.updatedAt : row.createdAt),
        })),
      ];
    }
    return [];
  });
  ngOnInit(): void {
    this.tipoEmpleadoApiService.getAll().subscribe();
  }
  displayUpdate(itemDto: TipoEmpleadoResponse) {
    this.router.navigate(['../actualizar/',itemDto.idTipoEmpleado], { relativeTo: this.route });

  }
  displayDelete(itemDto: TipoEmpleadoResponse) {
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
