import { Component, inject, OnDestroy, OnInit, signal, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AppPrimengModule } from '@shared/app-primeng/app-primeng.module';
import { BotonRegresarComponent } from '@shared/components/boton-regresar/boton-regresar.component';
import { DialogEliminarTodoComponent } from '@shared/components/dialog-eliminar-todo/dialog-eliminar-todo.component';
import { HeaderComponent } from '@shared/components/header/header.component';
import { ImportFileComponent } from '@shared/components/import-file/import-file.component';
import { BadgeEstatusOrdenComponent } from '@shared/components/badge-estatus-orden/badge-estatus-orden.component';
import { BadgePrioridadOrdenComponent } from '@shared/components/badge-prioridad-orden/badge-prioridad-orden.component';
import { DatetimePipe } from '@shared/pipes/datetime.pipe';
import { FormartNumberPipe } from '@shared/pipes/formart-number.pipe';
import {
  CatalogTableState,
  NativeColumn,
  NativeTableComponent,
  NATIVE_TABLE_IMPORTS,
} from '@shared/ui/native-table';
import { forkJoin } from 'rxjs';
import { EliminarComponent } from '../../almacen/eliminar/eliminar.component';
import { OrdenCompraApiService } from '../services/orden-compra.api.service';
import { OrdenResponseDto } from '../services/dtos/orden-compra.response.dto';

const PRIORIDAD = [
  { value: 'ALTA', label: 'Alta' },
  { value: 'MEDIA', label: 'Media' },
  { value: 'BAJA', label: 'Baja' },
];

const ESTATUS_FACTURA = [
  { value: 'PENDIENTE', label: 'Pendiente' },
  { value: 'BORRADOR', label: 'Borrador' },
  { value: 'FACTURADO', label: 'Facturado' },
  { value: 'COMPLETADA', label: 'Completada' },
];

@Component({
  selector: 'app-principal',
  imports: [
    BotonRegresarComponent,
    HeaderComponent,
    AppPrimengModule,
    EliminarComponent,
    ImportFileComponent,
    DialogEliminarTodoComponent,
    DatetimePipe,
    FormartNumberPipe,
    BadgeEstatusOrdenComponent,
    BadgePrioridadOrdenComponent,
    ...NATIVE_TABLE_IMPORTS,
  ],
  templateUrl: './principal.component.html',
  styleUrl: './principal.component.scss',
})
export class PrincipalComponent implements OnInit, OnDestroy {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  readonly solicitudCompraApiService = inject(OrdenCompraApiService);
  readonly page = new CatalogTableState<OrdenResponseDto>((query) => this.solicitudCompraApiService.getPage(query));
  readonly selectedIds = signal<string[]>([]);
  @ViewChild(EliminarComponent) eliminarComponent!: EliminarComponent;
  @ViewChild('importFile') importFile!: ImportFileComponent;
  @ViewChild(NativeTableComponent)
  set nativeTable(table: NativeTableComponent | undefined) {
    this.page.table = table;
  }

  configurationImport = {
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

  readonly columns: NativeColumn<OrdenResponseDto>[] = [
    { id: 'index', label: 'ID', width: 72, minWidth: 56, sortable: false, tooltip: false, align: 'left' },
    { id: 'seleccion', label: '', width: 48, minWidth: 44, sortable: false, tooltip: false, pinnable: false, align: 'center' },
    { id: 'folio', label: 'Solicitud', field: 'folio', width: 140, filter: { type: 'text' }, align: 'center' },
    { id: 'proveedor', label: 'Proveedor', width: 200, filter: { type: 'text' }, align: 'center' },
    { id: 'folioExterno', label: 'Folio externo', field: 'folioExterno', width: 160, filter: { type: 'text' }, align: 'center' },
    { id: 'totalOrden', label: 'Total', field: 'totalOrden', width: 130, filter: { type: 'number' }, align: 'center' },
    { id: 'prioridad', label: 'Prioridad', width: 140, filter: { type: 'select', options: PRIORIDAD }, align: 'center' },
    { id: 'fechaSolicitud', label: 'Solicitado', width: 170, filter: { type: 'date' }, align: 'center' },
    { id: 'fechaModificacion', label: 'Modificado', width: 170, filter: { type: 'date' }, align: 'center' },
    { id: 'estatusFactura', label: 'Estatus factura', width: 160, filter: { type: 'select', options: ESTATUS_FACTURA }, align: 'center' },
    { id: 'fechaFacturacion', label: 'Facturado', width: 170, filter: { type: 'date' }, align: 'center' },
    { id: 'acciones', label: 'Acciones', width: 230, minWidth: 210, sortable: false, tooltip: false, align: 'center' },
  ];

  acciones = [
    { label: 'Facturar', value: 'facturar' },
    { label: 'Recepcion del producto', value: 'recepcion' },
    { label: 'Cancelar', value: 'cancelar' },
  ];

  ngOnInit(): void {
    this.page.resetAndLoad();
  }

  ngOnDestroy(): void {
    this.page.destroy();
  }

  isSelected(id: string): boolean {
    return this.selectedIds().includes(id);
  }

  toggle(id: string, checked: boolean): void {
    this.selectedIds.update((ids) =>
      checked ? (ids.includes(id) ? ids : [...ids, id]) : ids.filter((item) => item !== id)
    );
  }

  exportar(): void {
    this.solicitudCompraApiService.getAll().subscribe((list) => this.importFile.export(list));
  }

  deleteAll(): void {
    const ids = this.selectedIds();
    this.selectedIds.set([]);
    if (!ids.length) {
      return;
    }
    forkJoin(ids.map((id) => this.solicitudCompraApiService.delete(id))).subscribe({
      next: () => this.page.resetAndLoad(),
      error: () => this.page.resetAndLoad(),
    });
  }

  ejecutarAccion(item: OrdenResponseDto, accionKey: string): void {
    const accion = this.accionesMap[accionKey];
    if (accion) {
      accion(item);
    }
  }

  private accionesMap: { [key: string]: (item: OrdenResponseDto) => void } = {
    facturar: (item) => this.facturar(item),
    cancelar: (item) => this.cancelar(item),
    recepcion: (item) => this.recepcion(item),
  };

  private facturar(item: OrdenResponseDto): void {
    this.router.navigate(['../actualizar-orden-compra', item.idSolicitud], { relativeTo: this.route });
  }

  private cancelar(item: OrdenResponseDto): void {
    this.solicitudCompraApiService.actualizarEstado(item.idSolicitud, 'CANCELADA').subscribe(() => {
      alert('Solicitud cancelada');
      this.page.resetAndLoad();
    });
  }

  private recepcion(item: OrdenResponseDto): void {
    this.solicitudCompraApiService.pasarRecepcion(item.idSolicitud).subscribe(() => this.page.resetAndLoad());
  }
}
