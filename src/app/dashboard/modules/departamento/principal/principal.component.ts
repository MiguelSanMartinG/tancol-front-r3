import {
  Component,
  computed,
  inject,
  OnInit,
  ViewChild,
} from '@angular/core';
import { AppPrimengModule } from '@shared/app-primeng/app-primeng.module';
import { BotonRegresarComponent } from '@shared/components/boton-regresar/boton-regresar.component';
import { HeaderComponent } from '@shared/components/header/header.component';
import { EditarComponent } from '../editar/editar.component';
import { DepartamentoApiService } from '../services/departamento.api.service';
import { StatusBinaryReadOnlyComponent } from '@shared/components/status-binary-read-only/status-binary-read-only.component';
import { DepartamentoResponseDto } from '../services/dtos/departamento.response.dto';
import { EliminarComponent } from '../eliminar/eliminar.component';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { DateTimeFormatService } from '@shared/services/date-time-format.service';

@Component({
  selector: 'app-principal',
  imports: [
    BotonRegresarComponent,
    HeaderComponent,
    AppPrimengModule,
    EditarComponent,
    StatusBinaryReadOnlyComponent,
    EliminarComponent,
    CommonModule
  ],
  templateUrl: './principal.component.html',
  styleUrl: './principal.component.scss',
})
export class PrincipalComponent implements OnInit {
  update = false;
  departamentoApiService = inject(DepartamentoApiService);
  @ViewChild(EditarComponent) editarComponent!: EditarComponent;
  @ViewChild(EliminarComponent) eliminarComponent!: EliminarComponent;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private dateTimeFormatService: DateTimeFormatService
  ) {}

  listaRegistros = computed(() => {
    if (this.departamentoApiService.listDepartamento().length > 0) {
      return [
        ...this.departamentoApiService.listDepartamento().map((row) => ({
          ...row,
          createdAt: new Date(row.createdAt),
          updatedAt: row.updatedAt ? new Date(row.updatedAt) : new Date(row.createdAt),
          createdAtStr: this.dateTimeFormatService.format(row.createdAt),
          updatedAtStr: this.dateTimeFormatService.format(row.updatedAt ? row.updatedAt : row.createdAt),
        })),
      ];
    }
    return [];
  });

  ngOnInit(): void {
    this.departamentoApiService.getAll().subscribe();
  }
  displayUpdate(itemDto: DepartamentoResponseDto) {

    this.router.navigate(['../actualizar/',itemDto.idDepartamento], { relativeTo: this.route });

  }
  displayDelete(itemDto: DepartamentoResponseDto) {
    console.log(itemDto);
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
