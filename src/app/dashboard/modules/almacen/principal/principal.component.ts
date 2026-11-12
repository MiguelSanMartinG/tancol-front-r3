import { Component, inject, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { AppPrimengModule } from '@shared/app-primeng/app-primeng.module';
import { BotonRegresarComponent } from '@shared/components/boton-regresar/boton-regresar.component';
import { HeaderComponent } from '@shared/components/header/header.component';
import { ImportFileComponent } from '@shared/components/import-file/import-file.component';
import { StatusBinaryReadOnlyComponent } from '@shared/components/status-binary-read-only/status-binary-read-only.component';
import { DatetimePipe } from '@shared/pipes/datetime.pipe';
import {
  CatalogTableState,
  NativeColumn,
  NativeTableComponent,
  NATIVE_TABLE_IMPORTS,
} from '@shared/ui/native-table';
import { EditarComponent } from '../editar/editar.component';
import { EliminarComponent } from '../eliminar/eliminar.component';
import { RegistrarAlmacenComponent } from '../registrar/registrar.component';
import { AlmacenApiService } from '../services/almacen.api.service';
import { AlmacenResponseDto } from '../services/dtos/almacen.response.dto';

const ESTADO = [
  { value: 'true', label: 'Activo' },
  { value: 'false', label: 'Inactivo' },
];

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
    ImportFileComponent,
    DatetimePipe,
    ...NATIVE_TABLE_IMPORTS,
  ],
  templateUrl: './principal.component.html',
  styleUrl: './principal.component.scss',
})
export class PrincipalComponent implements OnInit, OnDestroy {
  readonly api = inject(AlmacenApiService);
  readonly page = new CatalogTableState<AlmacenResponseDto>((query) => this.api.getPage(query));
  @ViewChild(RegistrarAlmacenComponent) registrarComponent!: RegistrarAlmacenComponent;
  @ViewChild(EditarComponent) editarComponent!: EditarComponent;
  @ViewChild(EliminarComponent) eliminarComponent!: EliminarComponent;
  @ViewChild(ImportFileComponent) importFile?: ImportFileComponent;
  @ViewChild(NativeTableComponent)
  set nativeTable(table: NativeTableComponent | undefined) {
    this.page.table = table;
  }

  readonly configurationImport = {
    properties: [
      { nameProperty: 'id', label: 'id', column: '', id: true },
      { nameProperty: 'nombre', label: 'Nombre', column: '', unique: true, id: false },
      { nameProperty: 'status', label: 'Estado', column: '', id: false, update: true },
    ],
    columns: [
      { header: 'id', key: 'id', width: 10 },
      { header: 'Nombre', key: 'nombre', width: 20 },
      { header: 'Estado', key: 'status', width: 20 },
    ],
    titleDownload: 'almacenes',
  };

  readonly columns: NativeColumn<AlmacenResponseDto>[] = [
    { id: 'index', label: 'ID', width: 72, minWidth: 56, sortable: false, tooltip: false, align: 'left' },
    { id: 'nombre', label: 'Nombre', field: 'nombre', width: 240, filter: { type: 'text' }, align: 'center' },
    { id: 'status', label: 'Estado', width: 120, filter: { type: 'select', options: ESTADO }, align: 'center' },
    { id: 'createdAt', label: 'Creado', width: 170, filter: { type: 'date' }, align: 'center' },
    { id: 'updatedAt', label: 'Actualizado', width: 170, filter: { type: 'date' }, align: 'center' },
    { id: 'acciones', label: 'Acciones', width: 120, minWidth: 112, sortable: false, tooltip: false, align: 'center' },
  ];

  ngOnInit(): void {
    this.page.resetAndLoad();
  }

  ngOnDestroy(): void {
    this.page.destroy();
  }

  displayCreate(): void {
    this.registrarComponent.display = true;
  }

  displayUpdate(item: AlmacenResponseDto): void {
    this.editarComponent.itemDto.set({ ...item });
    this.editarComponent.display = true;
  }

  displayDelete(item: AlmacenResponseDto): void {
    this.eliminarComponent.itemDto.set({ ...item });
    this.eliminarComponent.display = true;
  }

  exportar(): void {
    this.api.getAll().subscribe((list) => this.importFile?.export(list));
  }
}
