import { Component, inject, OnDestroy, OnInit, signal, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AppPrimengModule } from '@shared/app-primeng/app-primeng.module';
import { BotonRegresarComponent } from '@shared/components/boton-regresar/boton-regresar.component';
import { HeaderComponent } from '@shared/components/header/header.component';
import { StatusBinaryReadOnlyComponent } from '@shared/components/status-binary-read-only/status-binary-read-only.component';
import {
  CatalogTableState,
  NativeColumn,
  NativeTableComponent,
  NATIVE_TABLE_IMPORTS,
} from '@shared/ui/native-table';
import { EmpleadoApiService } from '../../empleados/services/empleado.api.service';
import { getEmpleadoNombreCompleto } from '../../empleados/services/dtos/empleado.response';
import { EliminarComponent } from '../eliminar/eliminar.component';
import { RutasApiService } from '../services/rutas-api.service';
import { ChoferBase, RutasResponse } from '../services/rutas.response';

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
    ...NATIVE_TABLE_IMPORTS,
  ],
  templateUrl: './principal.component.html',
  styleUrl: './principal.component.scss',
})
export class PrincipalComponent implements OnInit, OnDestroy {
  private readonly api = inject(RutasApiService);
  private readonly empleadosApi = inject(EmpleadoApiService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly empleadosMap = signal(new Map<string, string>());
  readonly page = new CatalogTableState<RutasResponse>((query) => this.api.getPage(query));
  @ViewChild(EliminarComponent) eliminarComponent!: EliminarComponent;
  @ViewChild(NativeTableComponent)
  set nativeTable(table: NativeTableComponent | undefined) {
    this.page.table = table;
  }

  readonly columns: NativeColumn<RutasResponse>[] = [
    { id: 'index', label: 'ID', width: 72, minWidth: 56, sortable: false, tooltip: false, align: 'left' },
    { id: 'nombre', label: 'Nombre', field: 'nombre', width: 180, filter: { type: 'text' }, align: 'center' },
    { id: 'numero', label: 'Número', field: 'numero', width: 120, filter: { type: 'text' }, align: 'center' },
    { id: 'chofer', label: 'Chofer', width: 200, filter: { type: 'text' }, align: 'center' },
    { id: 'ayudantes', label: 'Ayudantes', width: 220, sortable: false, tooltip: false, align: 'center' },
    { id: 'nota', label: 'Bloque de nota', width: 150, filter: { type: 'text' }, align: 'center' },
    { id: 'vehiculo', label: 'Vehículo', width: 160, filter: { type: 'text' }, align: 'center' },
    { id: 'producto', label: 'Producto', width: 180, filter: { type: 'text' }, align: 'center' },
    { id: 'enabled', label: 'Estado', width: 120, filter: { type: 'select', options: ESTADO }, align: 'center' },
    { id: 'acciones', label: 'Acciones', width: 120, minWidth: 112, sortable: false, tooltip: false, align: 'center' },
  ];

  ngOnInit(): void {
    this.empleadosApi.getAllFilter('?enabled=true').subscribe((resp) => {
      this.empleadosMap.set(new Map(resp.map((empleado) => [empleado.idEmpleado, getEmpleadoNombreCompleto(empleado)])));
    });
    this.page.resetAndLoad();
  }

  ngOnDestroy(): void {
    this.page.destroy();
  }

  nombreEmpleado(empleado: ChoferBase | null | undefined): string {
    if (!empleado) return '-';
    return this.empleadosMap().get(empleado.idEmpleado) ?? empleado.nombre ?? '-';
  }

  ayudantes(empleados: ChoferBase[] | null | undefined): string {
    if (!empleados?.length) return 'N/A';
    const names = empleados
      .map((empleado) => this.empleadosMap().get(empleado.idEmpleado) ?? empleado.nombre ?? '')
      .filter((name) => name);
    return names.length ? names.join(', ') : 'N/A';
  }

  displayCreate(): void {
    this.router.navigate(['../crear'], { relativeTo: this.route });
  }

  displayUpdate(item: RutasResponse): void {
    this.router.navigate(['../actualizar', item.id], { relativeTo: this.route });
  }

  displayDelete(item: RutasResponse): void {
    this.eliminarComponent.itemDto.set({ ...item });
    this.eliminarComponent.display = true;
  }
}
