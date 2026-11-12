import { Component, inject, OnDestroy, OnInit, signal, ViewChild } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AppPrimengModule } from '@shared/app-primeng/app-primeng.module';
import { BotonRegresarComponent } from '@shared/components/boton-regresar/boton-regresar.component';
import { DialogConfirmComponent } from '@shared/components/dialog-confirm/dialog-confirm.component';
import { DialogEliminarTodoComponent } from '@shared/components/dialog-eliminar-todo/dialog-eliminar-todo.component';
import { DialogOptionComponent } from '@shared/components/dialog-option/dialog-option.component';
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
import { OrdenApiService } from '../services/solicitud-compra.api.service';
import { OrdenResponseDto } from '../services/dtos/solicitud-compra.response.dto';

const PRIORIDAD = [
  { value: 'ALTA', label: 'Alta' },
  { value: 'MEDIA', label: 'Media' },
  { value: 'BAJA', label: 'Baja' },
];

const ESTATUS = [
  { value: 'PENDIENTE', label: 'Por autorizar' },
  { value: 'BORRADOR', label: 'Borrador' },
  { value: 'AUTORIZADO', label: 'Autorizada' },
  { value: 'COMPLETADA', label: 'Completada' },
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
    RouterLink,
    BadgeEstatusOrdenComponent,
    BadgePrioridadOrdenComponent,
    DialogConfirmComponent,
    DialogOptionComponent,
    ...NATIVE_TABLE_IMPORTS,
  ],
  templateUrl: './principal.component.html',
  styleUrl: './principal.component.scss',
})
export class PrincipalComponent implements OnInit, OnDestroy {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  readonly solicitudCompraApiService = inject(OrdenApiService);
  readonly page = new CatalogTableState<OrdenResponseDto>((query) => this.solicitudCompraApiService.getPage(query));
  readonly selectedIds = signal<string[]>([]);
  @ViewChild(EliminarComponent) eliminarComponent!: EliminarComponent;
  @ViewChild('importFile') importFile!: ImportFileComponent;
  @ViewChild('dialogConfirm') dialogConfirm!: DialogConfirmComponent;
  @ViewChild('dialogOption') dialogOption!: DialogOptionComponent;
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
    { id: 'proveedor', label: 'Proveedor', width: 220, filter: { type: 'text' }, align: 'center' },
    { id: 'partidas', label: 'Partidas', width: 110, sortable: false, tooltip: false, align: 'center' },
    { id: 'totalOrden', label: 'Total', field: 'totalOrden', width: 130, filter: { type: 'number' }, align: 'center' },
    { id: 'prioridad', label: 'Prioridad', width: 140, filter: { type: 'select', options: PRIORIDAD }, align: 'center' },
    { id: 'fechaSolicitud', label: 'Solicitado', width: 180, filter: { type: 'date' }, align: 'center' },
    { id: 'fechaModificacion', label: 'Modificado', width: 180, filter: { type: 'date' }, align: 'center' },
    { id: 'solicitudEstatus', label: 'Estatus', width: 160, filter: { type: 'select', options: ESTATUS }, align: 'center' },
    { id: 'acciones', label: 'Acciones', width: 220, minWidth: 196, sortable: false, tooltip: false, align: 'center' },
  ];

  actions = [
    { label: 'Modificar', value: 'editar' },
    { label: 'Cancelar', value: 'cancelar' },
    { label: 'Autorizar', value: 'autorizar' },
    { label: 'Completar', value: 'completar' },
  ];

  private tempitem: OrdenResponseDto | null = null;

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
    editar: (item) => this.editar(item),
    cancelar: (item) => this.cancelar(item),
    autorizar: (item) => this.autorizar(item),
    completar: (item) => this.completar(item),
  };

  private editar(item: OrdenResponseDto): void {
    this.router.navigate(['../actualizar-solicitud-compra', item.idSolicitud], { relativeTo: this.route });
  }

  private cancelar(item: OrdenResponseDto): void {
    this.tempitem = item;
    this.dialogOption.display = true;
    this.dialogOption.id = 'cancel';
    this.dialogOption.icon = 'fa-solid fa-triangle-exclamation';
    this.dialogOption.color = 'orange';
    this.dialogOption.title = 'Confirmar cancelación de solcitud,';
    this.dialogOption.description = 'Esta acción cancelara de forma permanente la solicitud de compra.';
    this.dialogOption.option1label = 'Cerrar';
    this.dialogOption.option1Severity = 'primary';
    this.dialogOption.option2label = 'Cancelar';
  }

  private autorizar(item: OrdenResponseDto): void {
    this.solicitudCompraApiService.actualizarEstado(item.idSolicitud, 'AUTORIZADO').subscribe(() => {
      this.page.resetAndLoad();
      this.dialogConfirm.display = true;
      this.dialogConfirm.icon = 'fa-solid fa-circle-check';
      this.dialogConfirm.labelBtn = 'Cerrar';
      this.dialogConfirm.title = 'Solicitud autorizada';
      this.dialogConfirm.description = '';
    });
  }

  private completar(item: OrdenResponseDto): void {
    this.solicitudCompraApiService.actualizarEstado(item.idSolicitud, 'COMPLETADA').subscribe(() => {
      this.page.resetAndLoad();
      this.dialogConfirm.display = true;
      this.dialogConfirm.icon = 'fa-solid fa-circle-check';
      this.dialogConfirm.labelBtn = 'Cerrar';
      this.dialogConfirm.title = 'Solicitud Completa';
      this.dialogConfirm.description = '';
    });
  }

  option1(event: string): void {
    if (event === 'cancel') {
      this.dialogOption.display = false;
    }
  }

  option2(event: string): void {
    if (event === 'cancel' && this.tempitem) {
      this.dialogOption.display = false;
      this.solicitudCompraApiService.actualizarEstado(this.tempitem.idSolicitud, 'CANCELADA').subscribe(() => {
        this.page.resetAndLoad();
        this.dialogConfirm.display = true;
        this.dialogConfirm.icon = 'fa-solid fa-circle-check';
        this.dialogConfirm.labelBtn = 'Cerrar';
        this.dialogConfirm.title = 'Solicitud Cancelada';
        this.dialogConfirm.description = '';
      });
    }
  }
}
