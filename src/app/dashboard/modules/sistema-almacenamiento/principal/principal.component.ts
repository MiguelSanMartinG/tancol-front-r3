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
import { DatetimePipe } from '@shared/pipes/datetime.pipe';
import { CommonModule } from '@angular/common';
import { StatusBinaryReadOnlyComponent } from '@shared/components/status-binary-read-only/status-binary-read-only.component';
import { RegistrarComponent } from '../registrar/registrar.component';
import { ActivatedRoute, Router } from '@angular/router';
import { SistemaAlmacenamientoApiService } from '../services/sistema-almacenamiento.api.service';
import { SistemaAlmacenamientoResponseDto } from '../services/dtos/sistema-almacenamiento.response.dto';
import { EliminarComponent } from '../eliminar/eliminar.component';
import { ImportFileComponent } from '@shared/components/import-file/import-file.component';
import { DateTimeFormatService } from '@shared/services/date-time-format.service';

@Component({
  selector: 'app-principal',
  imports: [
    BotonRegresarComponent,
    HeaderComponent,
    AppPrimengModule,
    RegistrarComponent,
    DatetimePipe,
    StatusBinaryReadOnlyComponent,
    EliminarComponent,
    ImportFileComponent,
    CommonModule,
  ],
  templateUrl: './principal.component.html',
  styleUrl: './principal.component.scss',
})
export class PrincipalComponent implements OnInit {
  update = false;
  sistemaAlmacenamientoApiService = inject(SistemaAlmacenamientoApiService);
  @ViewChild(EliminarComponent) eliminarComponent!: EliminarComponent;
  configurationImport = {
    service: null,
    properties: [
      {
        nameProperty: 'nombre',
        label: 'Nombre',
        column: '',
        unique: true,
        id: false,
        required: true,
        type: 'text',
      },
      {
        label: 'Alias',
        nameProperty: 'alias',
        required: false,
        type: 'text',
      },
    ],
    columns: [{ header: 'Nombre', key: 'nombre', width: 30 }],
    titleDownload: 'Sistemas de almacenamiento',
  };

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private dateTimeFormatService: DateTimeFormatService
  ) {
    this.configurationImport.service = <any>this.sistemaAlmacenamientoApiService;
  }

  listaRegistros = computed(() => {
    if (this.sistemaAlmacenamientoApiService.listAll().length > 0) {
      return [
        ...this.sistemaAlmacenamientoApiService.listAll().map((row) => ({
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
    this.sistemaAlmacenamientoApiService.getAll().subscribe();
  }
  displayUpdate(itemDto: SistemaAlmacenamientoResponseDto) {
    this.router.navigate(['../actualizar/', itemDto.id], { relativeTo: this.route });
  }
  displayDelete(itemDto: SistemaAlmacenamientoResponseDto) {
    this.eliminarComponent.itemDto.set({ ...itemDto });
    this.eliminarComponent.display = true;
  }
  displayCreate() {
    this.router.navigate(['../crear'], { relativeTo: this.route });
  }
  searchTable(tableComponent: any, $event: any) {
    tableComponent.filterGlobal($event.target!.value ?? '', 'contains');
  }
  deleteall() {
    for (const element of this.listaRegistros()) {
      this.sistemaAlmacenamientoApiService.delete(element.id).subscribe();
    }
  }
}
