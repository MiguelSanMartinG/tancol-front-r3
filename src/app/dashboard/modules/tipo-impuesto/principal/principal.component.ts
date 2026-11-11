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
import { EditarComponent } from '../editar/editar.component';
import { RegistrarTipoImpuestoComponent } from '../registrar/registrar.component';
import { TipoImpuestoApiService } from '../services/tipo-impuesto.api.service';
import { DatetimePipe } from '@shared/pipes/datetime.pipe';
import { StatusBinaryReadOnlyComponent } from '@shared/components/status-binary-read-only/status-binary-read-only.component';
import { TipoImpuestoResponseDto } from '../services/dtos/tipo-impuesto.response.dto';
import { EliminarComponent } from '../eliminar/eliminar.component';
import { CommonModule } from '@angular/common';
import { DateTimeFormatService } from '@shared/services/date-time-format.service';

@Component({
  selector: 'app-principal',
  imports: [
    BotonRegresarComponent,
    HeaderComponent,
    AppPrimengModule,
    RegistrarTipoImpuestoComponent,
    EditarComponent,
    DatetimePipe,
    StatusBinaryReadOnlyComponent,
    EliminarComponent,
    CommonModule
  ],
  templateUrl: './principal.component.html',
  styleUrl: './principal.component.scss',
})
export class PrincipalComponent implements OnInit {
  update = false;
  tipoImpuestoApiService = inject(TipoImpuestoApiService);
  @ViewChild(RegistrarTipoImpuestoComponent) registrarComponent!: RegistrarTipoImpuestoComponent;
  @ViewChild(EditarComponent) editarComponent!: EditarComponent;
  @ViewChild(EliminarComponent) eliminarComponent!: EliminarComponent;

  constructor(private dateTimeFormatService: DateTimeFormatService) {}

  listaRegistros = computed(() => {
    if (this.tipoImpuestoApiService.listAll().length > 0) {
      return [
        ...this.tipoImpuestoApiService.listAll().map((row) => ({
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
    this.tipoImpuestoApiService.getAll().subscribe();
  }
  displayUpdate(itemDto: TipoImpuestoResponseDto) {
    this.editarComponent.itemDto.set({
      ...itemDto
    });
    this.editarComponent.display = true;
  }
  displayDelete(itemDto: TipoImpuestoResponseDto) {
    this.eliminarComponent.itemDto.set({
      ...itemDto
    });
    this.eliminarComponent.display = true;
  }
  displayCreate() {
    this.registrarComponent.display = true;
  }
  searchTable(tableComponent: any, $event: any){
    tableComponent.filterGlobal($event.target!.value ?? '', 'contains')
  }
}
