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
import { RegistrarAlmacenComponent } from '../registrar/registrar.component';
import { AlmacenApiService } from '../services/almacen.api.service';
import { DatetimePipe } from '@shared/pipes/datetime.pipe';
import { StatusBinaryReadOnlyComponent } from '@shared/components/status-binary-read-only/status-binary-read-only.component';
import { AlmacenResponseDto } from '../services/dtos/almacen.response.dto';
import { EliminarComponent } from '../eliminar/eliminar.component';
import { FormsModule } from '@angular/forms';
import { ImportFileComponent } from "../../../../shared/components/import-file/import-file.component";
import { CommonModule } from '@angular/common';
import { DateTimeFormatService } from '@shared/services/date-time-format.service';

@Component({
  selector: 'app-principal',
  imports: [
    BotonRegresarComponent,
    HeaderComponent,
    AppPrimengModule,
    RegistrarAlmacenComponent,
    EditarComponent,
    StatusBinaryReadOnlyComponent,
    EliminarComponent,
    FormsModule,
    ImportFileComponent,
    DatetimePipe,
    CommonModule
],
  templateUrl: './principal.component.html',
  styleUrl: './principal.component.scss',
})
export class PrincipalComponent implements OnInit {
  update = false;
  almacenApiService = inject(AlmacenApiService);
  @ViewChild(RegistrarAlmacenComponent)
  registrarComponent!: RegistrarAlmacenComponent;
  @ViewChild(EditarComponent) editarComponent!: EditarComponent;
  @ViewChild(EliminarComponent) eliminarComponent!: EliminarComponent;

  constructor(private dateTimeFormatService: DateTimeFormatService) {}
  configurationImport = {
    properties: [
      {
        nameProperty: 'id',
        label: 'id',
        column: '',
        id: true,
      },
      {
        nameProperty: 'nombre',
        label: 'Nombre',
        column: '',
        unique: true,
        id: false,
      },
      {
        nameProperty: 'status',
        label: 'Estado',
        column: '',
        id: false,
        update: true
      }
    ],
    columns: [
      { header: 'id', key: 'id', width: 10},
      { header: 'Nombre', key: 'nombre', width: 20 },
      { header: 'Estado', key: 'status', width: 20 },
    ],
    titleDownload: 'almacenes'
  }
  listaRegistros = computed( ()=> {
    if(this.almacenApiService.listAll().length > 0){
      return [...this.almacenApiService.listAll().map( row => ({
        ...row,
        createdAt: new Date(row.createdAt),
        updatedAt: (row.updatedAt)? new Date(row.updatedAt): new Date(row.createdAt),
        createdAtStr: this.dateTimeFormatService.format(row.createdAt),
        updatedAtStr: this.dateTimeFormatService.format((row.updatedAt)?row.updatedAt:row.createdAt)
      }))]
    }
    return [];
  })

  ngOnInit(): void {
    this.almacenApiService.getAll().subscribe();
  }
  displayUpdate(itemDto: AlmacenResponseDto) {
    this.editarComponent.itemDto.set({
      ...itemDto,
    });
    this.editarComponent.display = true;
  }
  displayDelete(itemDto: AlmacenResponseDto) {
    this.eliminarComponent.itemDto.set({
      ...itemDto,
    });
    this.eliminarComponent.display = true;
  }
  displayCreate() {
    this.registrarComponent.display = true;
  }
  searchTable(tableComponent: any, $event: any) {
    tableComponent.filterGlobal($event.target!.value ?? '', 'contains');
  }
}
