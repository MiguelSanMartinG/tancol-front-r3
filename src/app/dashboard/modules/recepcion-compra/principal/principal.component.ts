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
import {
  CatalogTableState,
  NativeColumn,
  NativeTableComponent,
  NATIVE_TABLE_IMPORTS,
} from '@shared/ui/native-table';
import { forkJoin } from 'rxjs';
import { EliminarComponent } from '../../almacen/eliminar/eliminar.component';
import { OrdenCompraApiService } from '../../orden-compra/services/orden-compra.api.service';
import { OrderReciboService } from '../service/order-recibo/order-recibo.service';
import { OrdenReciboResponse } from '../service/dto/order-recibo.response';

const PRIORIDAD = [
  { value: 'ALTA', label: 'Alta' },
  { value: 'MEDIA', label: 'Media' },
  { value: 'BAJA', label: 'Baja' },
];

const ESTATUS_RECIBO = [
  { value: 'PENDIENTE', label: 'Pendiente' },
  { value: 'BORRADOR', label: 'Borrador' },
  { value: 'RECIBIDA', label: 'Recibida' },
  { value: 'CANCELADA', label: 'Cancelada' },
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
  readonly orderReciboService = inject(OrderReciboService);
  readonly page = new CatalogTableState<OrdenReciboResponse>((query) => this.orderReciboService.getPage(query));
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

  readonly columns: NativeColumn<OrdenReciboResponse>[] = [
    { id: 'index', label: 'ID', width: 72, minWidth: 56, sortable: false, tooltip: false, align: 'left' },
    { id: 'seleccion', label: '', width: 48, minWidth: 44, sortable: false, tooltip: false, pinnable: false, align: 'center' },
    { id: 'folio', label: 'Solicitud', field: 'folio', width: 150, filter: { type: 'text' }, align: 'center' },
    { id: 'proveedor', label: 'Proveedor', width: 220, filter: { type: 'text' }, align: 'center' },
    { id: 'partidas', label: 'Total partidas', width: 140, sortable: false, tooltip: false, align: 'center' },
    { id: 'prioridad', label: 'Prioridad', width: 140, filter: { type: 'select', options: PRIORIDAD }, align: 'center' },
    { id: 'fechaSolicitud', label: 'Solicitado el', width: 180, filter: { type: 'date' }, align: 'center' },
    { id: 'fechaRecibo', label: 'Recibido el', width: 180, filter: { type: 'date' }, align: 'center' },
    { id: 'recepcionEstatus', label: 'Estatus', width: 150, filter: { type: 'select', options: ESTATUS_RECIBO }, align: 'center' },
    { id: 'acciones', label: 'Acciones', width: 220, minWidth: 196, sortable: false, tooltip: false, align: 'center' },
  ];

  acciones = [{ label: 'Dar entrada', value: 'darentrada' }];

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
    this.orderReciboService.getAll().subscribe((list) => this.importFile.export(list));
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

  ejecutarAccion(item: OrdenReciboResponse, accionKey: string): void {
    if (accionKey === 'darentrada') {
      this.router.navigate(['../recepcion-orden-compra', item.idSolicitud], { relativeTo: this.route });
    }
  }
}
