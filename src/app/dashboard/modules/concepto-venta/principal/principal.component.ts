import { Component, effect, inject, OnDestroy, OnInit, untracked, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AppPrimengModule } from '@shared/app-primeng/app-primeng.module';
import { BotonRegresarComponent } from '@shared/components/boton-regresar/boton-regresar.component';
import { HeaderComponent } from '@shared/components/header/header.component';
import { StatusBinaryReadOnlyComponent } from '@shared/components/status-binary-read-only/status-binary-read-only.component';
import { DatetimePipe } from '@shared/pipes/datetime.pipe';
import {
  CatalogTableState,
  localPageSource,
  NativeColumn,
  NativeTableComponent,
  NATIVE_TABLE_IMPORTS,
  readPath,
} from '@shared/ui/native-table';
import { TagModule } from 'primeng/tag';
import { tap } from 'rxjs';
import { EliminarComponent } from '../eliminar/eliminar.component';
import { ConceptoVentaApiService } from '../services/concepto-venta.api.service';
import { ConceptoVentaResponseDto } from '../services/dtos/concepto-venta.response.dto';

const ESTADO = [
  { value: 'true', label: 'Activo' },
  { value: 'false', label: 'Inactivo' },
];

const SI_NO = [
  { value: 'true', label: 'Sí' },
  { value: 'false', label: 'No' },
];

/** Columnas booleanas: se filtran/ordenan como 'true' | 'false'. */
const BOOLEANAS = new Set(['descuento', 'cancelado', 'exclude', 'enabled']);

@Component({
  selector: 'app-principal-concepto-venta',
  templateUrl: './principal.component.html',
  styleUrl: './principal.component.scss',
  imports: [
    BotonRegresarComponent,
    HeaderComponent,
    AppPrimengModule,
    StatusBinaryReadOnlyComponent,
    EliminarComponent,
    DatetimePipe,
    TagModule,
    ...NATIVE_TABLE_IMPORTS,
  ],
})
export class PrincipalConceptoVentaComponent implements OnInit, OnDestroy {
  private readonly api = inject(ConceptoVentaApiService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  @ViewChild(EliminarComponent) eliminarComponent!: EliminarComponent;
  @ViewChild(NativeTableComponent)
  set nativeTable(table: NativeTableComponent | undefined) {
    this.page.table = table;
  }

  readonly columns: NativeColumn<ConceptoVentaResponseDto>[] = [
    { id: 'index', label: 'ID', width: 72, minWidth: 56, sortable: false, tooltip: false, align: 'left' },
    { id: 'concepto', label: 'Concepto', field: 'concepto', width: 240, filter: { type: 'text' }, align: 'left' },
    { id: 'descuento', label: 'Descuento', width: 120, filter: { type: 'select', options: SI_NO }, align: 'left' },
    { id: 'cancelado', label: 'Cancelar', width: 120, filter: { type: 'select', options: SI_NO }, align: 'left' },
    { id: 'exclude', label: 'PF', width: 100, filter: { type: 'select', options: SI_NO }, align: 'left' },
    { id: 'enabled', label: 'Estatus', width: 120, filter: { type: 'select', options: ESTADO }, align: 'left' },
    { id: 'createdAt', label: 'Creado', width: 170, filter: { type: 'date' }, align: 'left' },
    { id: 'updatedAt', label: 'Actualizado', width: 170, filter: { type: 'date' }, align: 'left' },
    { id: 'acciones', label: 'Acciones', width: 120, minWidth: 112, sortable: false, tooltip: false, align: 'center' },
  ];

  /** Última lista recibida del servidor; si el servicio cambia `listAll` (p. ej. al eliminar), se recarga. */
  private lastList: unknown = this.api.listAll();
  private readonly source = localPageSource<ConceptoVentaResponseDto>(
    () => this.api.getAll().pipe(tap((list) => (this.lastList = list))),
    this.columns,
    {
      value: (row, key) => {
        if (key === 'updatedAt') return row.updatedAt || row.createdAt;
        if (BOOLEANAS.has(key)) return String(!!readPath(row, key));
        return readPath(row, key);
      },
      // La búsqueda global sigue cubriendo concepto y nombre como antes.
      searchKeys: ['concepto', 'name'],
    },
  );
  readonly page = new CatalogTableState<ConceptoVentaResponseDto>(this.source.request);

  constructor() {
    effect(() => {
      const list = this.api.listAll();
      if (list !== this.lastList) untracked(() => this.reload());
    });
  }

  ngOnInit(): void {
    this.page.resetAndLoad();
  }

  ngOnDestroy(): void {
    this.page.destroy();
  }

  private reload(): void {
    this.source.invalidate();
    this.page.resetAndLoad();
  }

  displayCreate(): void {
    this.router.navigate(['../crear'], { relativeTo: this.route });
  }

  displayUpdate(item: ConceptoVentaResponseDto): void {
    this.router.navigate(['../actualizar', item.id], { relativeTo: this.route });
  }

  displayDelete(item: ConceptoVentaResponseDto): void {
    this.eliminarComponent.itemDto.set({ ...item });
    this.eliminarComponent.display = true;
  }
}
