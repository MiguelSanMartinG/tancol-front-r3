import { CommonModule } from '@angular/common';
import { Component, inject, OnDestroy, OnInit, signal, ViewChild } from '@angular/core';
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
import { MetaVentaApiService } from '../../metas-ventas/services/meta-venta.api.service';
import { MetaVentaRevision } from '../../metas-ventas/services/meta-venta.model';
import { EliminarComponent } from '../eliminar/eliminar.component';
import { EmpleadoApiService } from '../services/empleado.api.service';
import { EmpleadoResponseDto, getEmpleadoNombreCompleto } from '../services/dtos/empleado.response';

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
    DatetimePipe,
    StatusBinaryReadOnlyComponent,
    EliminarComponent,
    CommonModule,
    ...NATIVE_TABLE_IMPORTS,
  ],
  templateUrl: './principal.component.html',
  styleUrl: './principal.component.scss',
})
export class PrincipalComponent implements OnInit, OnDestroy {
  private readonly api = inject(EmpleadoApiService);
  private readonly metasApi = inject(MetaVentaApiService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  readonly page = new CatalogTableState<EmpleadoResponseDto>((query) => this.api.getPage(query));
  readonly revisionMetas = signal<MetaVentaRevision | null>(null);
  dialogRevisionVisible = false;
  @ViewChild(EliminarComponent) eliminarComponent!: EliminarComponent;
  @ViewChild(NativeTableComponent)
  set nativeTable(table: NativeTableComponent | undefined) {
    this.page.table = table;
  }

  readonly columns: NativeColumn<EmpleadoResponseDto>[] = [
    { id: 'index', label: 'ID', width: 72, minWidth: 56, sortable: false, tooltip: false, align: 'left' },
    { id: 'nombreCompleto', label: 'Nombre completo', width: 240, filter: { type: 'text' }, align: 'center' },
    { id: 'tipoEmpleado', label: 'Tipo de empleado', width: 180, filter: { type: 'text' }, align: 'center' },
    { id: 'departamento', label: 'Departamento', width: 180, filter: { type: 'text' }, align: 'center' },
    { id: 'role', label: 'Rol', width: 150, filter: { type: 'text' }, align: 'center' },
    { id: 'createdAt', label: 'Creado', width: 170, filter: { type: 'date' }, align: 'center' },
    { id: 'updatedAt', label: 'Modificado', width: 170, filter: { type: 'date' }, align: 'center' },
    { id: 'enabled', label: 'Estado', width: 120, filter: { type: 'select', options: ESTADO }, align: 'center' },
    { id: 'acciones', label: 'Acciones', width: 210, minWidth: 196, sortable: false, tooltip: false, align: 'center' },
  ];

  ngOnInit(): void {
    this.page.resetAndLoad();
  }

  ngOnDestroy(): void {
    this.page.destroy();
  }

  nombre(row: EmpleadoResponseDto): string {
    return getEmpleadoNombreCompleto(row);
  }

  displayCreate(): void {
    this.router.navigate(['../crear'], { relativeTo: this.route });
  }

  displayUpdate(item: EmpleadoResponseDto): void {
    this.router.navigate(['../actualizar', item.idEmpleado], { relativeTo: this.route });
  }

  displayDelete(item: EmpleadoResponseDto): void {
    this.eliminarComponent.itemDto.set({ ...item });
    this.eliminarComponent.display = true;
  }

  displayMetas(item: EmpleadoResponseDto): void {
    this.router.navigate(['../metas-ventas', item.idEmpleado], { relativeTo: this.route });
  }

  displayProductoRoto(item: EmpleadoResponseDto): void {
    this.router.navigate(['../producto-roto', item.idEmpleado], { relativeTo: this.route });
  }

  revisarMetas(): void {
    this.metasApi.revisar().subscribe((resultado) => {
      this.revisionMetas.set(resultado);
      this.dialogRevisionVisible = true;
    });
  }
}
