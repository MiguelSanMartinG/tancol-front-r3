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
import { EditarComponent } from '../editar/editar.component';
import { RegistrarProductoComponent } from '../registrar/registrar.component';
import { NuestrosProductosService } from '../service/nuestros-productos.service';
import { NuestrosProductosResponse } from '../service/nuestros-productos.response';

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
    RegistrarProductoComponent,
    EditarComponent,
    ...NATIVE_TABLE_IMPORTS,
  ],
  templateUrl: './principal.component.html',
  styleUrl: './principal.component.scss',
})
export class PrincipalComponent implements OnInit, OnDestroy {
  private readonly api = inject(NuestrosProductosService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  readonly page = new CatalogTableState<NuestrosProductosResponse>((query) => this.api.getPage(query));
  @ViewChild(EliminarComponent) eliminarComponent!: EliminarComponent;
  @ViewChild(RegistrarProductoComponent) registrarComponent!: RegistrarProductoComponent;
  @ViewChild(EditarComponent) editarComponent!: EditarComponent;
  @ViewChild(NativeTableComponent)
  set nativeTable(table: NativeTableComponent | undefined) {
    this.page.table = table;
  }

  readonly columns: NativeColumn<NuestrosProductosResponse>[] = [
    { id: 'index', label: 'ID', width: 72, minWidth: 56, sortable: false, tooltip: false, align: 'left' },
    { id: 'sku', label: 'SKU', field: 'sku', width: 140, filter: { type: 'text' }, align: 'center' },
    { id: 'nombre', label: 'Nombre', field: 'nombre', width: 200, filter: { type: 'text' }, align: 'center' },
    { id: 'alias', label: 'Alias', field: 'alias', width: 150, filter: { type: 'text' }, align: 'center' },
    { id: 'presentacion', label: 'Presentación', width: 170, filter: { type: 'number' }, align: 'center' },
    { id: 'precio', label: 'Precio', width: 130, filter: { type: 'number' }, align: 'center' },
    { id: 'createdAt', label: 'Creado', width: 170, filter: { type: 'date' }, align: 'center' },
    { id: 'updatedAt', label: 'Actualizado', width: 170, filter: { type: 'date' }, align: 'center' },
    { id: 'enabled', label: 'Estado', width: 120, filter: { type: 'select', options: ESTADO }, align: 'center' },
    { id: 'acciones', label: 'Acciones', width: 160, minWidth: 152, sortable: false, tooltip: false, align: 'center' },
  ];

  ngOnInit(): void {
    this.page.resetAndLoad();
  }

  ngOnDestroy(): void {
    this.page.destroy();
  }

  presentacion(row: NuestrosProductosResponse): string {
    const unidad = row.unidadMedidaDefault?.nombre ?? '';
    return `${row.presentacion ?? ''} ${unidad}`.trim();
  }

  displayCreate(): void {
    this.registrarComponent.display = true;
  }

  displayComisiones(item: NuestrosProductosResponse): void {
    this.router.navigate(['../comisiones', item.idProductoComercial], { relativeTo: this.route });
  }

  displayUpdate(item: NuestrosProductosResponse): void {
    this.editarComponent.itemDto.set({ ...item });
    this.editarComponent.display = true;
  }

  displayDelete(item: NuestrosProductosResponse): void {
    this.eliminarComponent.itemDto.set({ ...item });
    this.eliminarComponent.display = true;
  }
}
