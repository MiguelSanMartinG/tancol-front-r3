import { CommonModule } from '@angular/common';
import { TagModule } from 'primeng/tag';
import { Component, inject, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AppPrimengModule } from '@shared/app-primeng/app-primeng.module';
import { BotonRegresarComponent } from '@shared/components/boton-regresar/boton-regresar.component';
import { HeaderComponent } from '@shared/components/header/header.component';
import { DatetimePipe } from '@shared/pipes/datetime.pipe';
import {
  CatalogTableState,
  NativeColumn,
  NativeTableComponent,
  NATIVE_TABLE_IMPORTS,
} from '@shared/ui/native-table';
import { EliminarComponent } from '../eliminar/eliminar.component';
import { VehiculosApiService } from '../services/vehiculos-api.service';
import { VehiculosResponse } from '../services/vehiculos.response';

const ESTATUS = [
  { value: 'DISPONIBLE', label: 'Disponible' },
  { value: 'EN_TALLER', label: 'En taller' },
  { value: 'FUERA_DE_SERVICIO', label: 'Fuera de servicio' },
];

@Component({
  selector: 'app-principal',
  imports: [
    TagModule,
    CommonModule,
    BotonRegresarComponent,
    HeaderComponent,
    AppPrimengModule,
    DatetimePipe,
    EliminarComponent,
    ...NATIVE_TABLE_IMPORTS,
  ],
  templateUrl: './principal.component.html',
  styleUrl: './principal.component.scss',
})
export class PrincipalComponent implements OnInit, OnDestroy {
  private readonly api = inject(VehiculosApiService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  readonly page = new CatalogTableState<VehiculosResponse>((query) => this.api.getPage(query));
  @ViewChild(EliminarComponent) eliminarComponent!: EliminarComponent;
  @ViewChild(NativeTableComponent)
  set nativeTable(table: NativeTableComponent | undefined) {
    this.page.table = table;
  }

  readonly columns: NativeColumn<VehiculosResponse>[] = [
    { id: 'index', label: 'ID', width: 72, minWidth: 56, sortable: false, tooltip: false, align: 'left' },
    { id: 'nombre', label: 'Nombre', field: 'nombre', width: 200, filter: { type: 'text' }, align: 'center' },
    { id: 'placas', label: 'Placas', field: 'placas', width: 140, filter: { type: 'text' }, align: 'center' },
    { id: 'status', label: 'Estatus', width: 170, filter: { type: 'select', options: ESTATUS }, align: 'center' },
    { id: 'capacidadMaxima', label: 'Cap. max.', width: 160, filter: { type: 'number' }, align: 'center' },
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

  transformarEstado(estado: string): string {
    return ESTATUS.find((option) => option.value === estado)?.label ?? estado;
  }

  getEstadoSeveridad(estado: string): 'success' | 'warn' | 'danger' | 'secondary' {
    switch (estado) {
      case 'DISPONIBLE':
        return 'success';
      case 'EN_TALLER':
        return 'warn';
      case 'FUERA_DE_SERVICIO':
        return 'danger';
      default:
        return 'secondary';
    }
  }

  displayCreate(): void {
    this.router.navigate(['../crear'], { relativeTo: this.route });
  }

  displayUpdate(item: VehiculosResponse): void {
    this.router.navigate(['../actualizar', item.id], { relativeTo: this.route });
  }

  displayDelete(item: VehiculosResponse): void {
    this.eliminarComponent.itemDto.set({ ...item });
    this.eliminarComponent.display = true;
  }
}
