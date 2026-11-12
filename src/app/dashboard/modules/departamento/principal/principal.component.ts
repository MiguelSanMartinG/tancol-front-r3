import { Component, inject, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AppPrimengModule } from '@shared/app-primeng/app-primeng.module';
import { BotonRegresarComponent } from '@shared/components/boton-regresar/boton-regresar.component';
import { HeaderComponent } from '@shared/components/header/header.component';
import { StatusBinaryReadOnlyComponent } from '@shared/components/status-binary-read-only/status-binary-read-only.component';
import { DatetimePipe } from '@shared/pipes/datetime.pipe';
import {
  CatalogTableState,
  NativeColumn,
  NativeTableComponent,
  NATIVE_TABLE_IMPORTS,
} from '@shared/ui/native-table';
import { EliminarComponent } from '../eliminar/eliminar.component';
import { DepartamentoApiService } from '../services/departamento.api.service';
import { DepartamentoResponseDto } from '../services/dtos/departamento.response.dto';

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
    StatusBinaryReadOnlyComponent,
    EliminarComponent,
    DatetimePipe,
    ...NATIVE_TABLE_IMPORTS,
  ],
  templateUrl: './principal.component.html',
  styleUrl: './principal.component.scss',
})
export class PrincipalComponent implements OnInit, OnDestroy {
  private readonly api = inject(DepartamentoApiService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  readonly page = new CatalogTableState<DepartamentoResponseDto>((query) => this.api.getPage(query));
  @ViewChild(EliminarComponent) eliminarComponent!: EliminarComponent;
  @ViewChild(NativeTableComponent)
  set nativeTable(table: NativeTableComponent | undefined) {
    this.page.table = table;
  }

  readonly columns: NativeColumn<DepartamentoResponseDto>[] = [
    { id: 'index', label: 'ID', width: 72, minWidth: 56, sortable: false, tooltip: false, align: 'left' },
    { id: 'nombre', label: 'Nombre', field: 'nombre', width: 240, filter: { type: 'text' }, align: 'center' },
    { id: 'createdAt', label: 'Creado', width: 170, filter: { type: 'date' }, align: 'center' },
    { id: 'updatedAt', label: 'Actualizado', width: 170, filter: { type: 'date' }, align: 'center' },
    { id: 'status', label: 'Estado', width: 120, filter: { type: 'select', options: ESTADO }, align: 'center' },
    { id: 'acciones', label: 'Acciones', width: 120, minWidth: 112, sortable: false, tooltip: false, align: 'center' },
  ];

  ngOnInit(): void {
    this.page.resetAndLoad();
  }

  ngOnDestroy(): void {
    this.page.destroy();
  }

  displayCreate(): void {
    this.router.navigate(['../crear'], { relativeTo: this.route });
  }

  displayUpdate(item: DepartamentoResponseDto): void {
    this.router.navigate(['../actualizar', item.idDepartamento], { relativeTo: this.route });
  }

  displayDelete(item: DepartamentoResponseDto): void {
    this.eliminarComponent.itemDto.set({ ...item });
    this.eliminarComponent.display = true;
  }
}
