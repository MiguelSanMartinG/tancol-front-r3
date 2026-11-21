import { Component, effect, inject, OnDestroy, OnInit, untracked, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AppPrimengModule } from '@shared/app-primeng/app-primeng.module';
import { BotonRegresarComponent } from '@shared/components/boton-regresar/boton-regresar.component';
import { HeaderComponent } from '@shared/components/header/header.component';
import { ImportFileComponent } from '@shared/components/import-file/import-file.component';
import { DatetimePipe } from '@shared/pipes/datetime.pipe';
import {
  CatalogTableState,
  localPageSource,
  NativeColumn,
  NativeTableComponent,
  NATIVE_TABLE_IMPORTS,
  readPath,
} from '@shared/ui/native-table';
import { tap } from 'rxjs';
import { EliminarComponent } from '../eliminar/eliminar.component';
import { TipoClienteResponse } from '../services/tipo-cliente-response';
import { TipoClienteApiService } from '../services/tipo-cliente.api.service';

@Component({
  selector: 'app-principal',
  templateUrl: './principal.component.html',
  styleUrl: './principal.component.scss',
  imports: [
    BotonRegresarComponent,
    HeaderComponent,
    AppPrimengModule,
    EliminarComponent,
    ImportFileComponent,
    DatetimePipe,
    ...NATIVE_TABLE_IMPORTS,
  ],
})
export class PrincipalComponent implements OnInit, OnDestroy {
  readonly api = inject(TipoClienteApiService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  @ViewChild(EliminarComponent) eliminarComponent!: EliminarComponent;
  @ViewChild(NativeTableComponent)
  set nativeTable(table: NativeTableComponent | undefined) {
    this.page.table = table;
  }

  readonly configurationImport = {
    service: this.api as any,
    properties: [
      { nameProperty: 'nombre', label: 'Nombre', column: '', unique: true, id: false, required: true, type: 'text' },
      { label: 'Alias', nameProperty: 'alias', required: false, type: 'text' },
    ],
    columns: [{ header: 'Nombre', key: 'nombre', width: 30 }],
    titleDownload: 'clientes',
  };

  readonly columns: NativeColumn<TipoClienteResponse>[] = [
    { id: 'index', label: 'ID', width: 72, minWidth: 56, sortable: false, tooltip: false, align: 'left' },
    { id: 'nombre', label: 'Nombre', field: 'nombre', width: 240, filter: { type: 'text' }, align: 'left' },
    { id: 'alias', label: 'Alias', field: 'alias', width: 200, filter: { type: 'text' }, align: 'left' },
    { id: 'createdAt', label: 'Creado', width: 170, filter: { type: 'date' }, align: 'left' },
    { id: 'updatedAt', label: 'Actualizado', width: 170, filter: { type: 'date' }, align: 'left' },
    { id: 'acciones', label: 'Acciones', width: 120, minWidth: 112, sortable: false, tooltip: false, align: 'center' },
  ];

  /** Última lista recibida del servidor; si el servicio cambia `listAll` (p. ej. al eliminar), se recarga. */
  private lastList: unknown = this.api.listAll();
  private readonly source = localPageSource<TipoClienteResponse>(
    () => this.api.getAll().pipe(tap((list) => (this.lastList = list))),
    this.columns,
    { value: (row, key) => (key === 'updatedAt' ? row.updatedAt || row.createdAt : readPath(row, key)) },
  );
  readonly page = new CatalogTableState<TipoClienteResponse>(this.source.request);

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

  reload(): void {
    this.source.invalidate();
    this.page.resetAndLoad();
  }

  displayCreate(): void {
    this.router.navigate(['../crear'], { relativeTo: this.route });
  }

  displayUpdate(item: TipoClienteResponse): void {
    this.router.navigate(['../actualizar/', item.idTiposClientes], { relativeTo: this.route });
  }

  displayDelete(item: TipoClienteResponse): void {
    this.eliminarComponent.itemDto.set({ ...item });
    this.eliminarComponent.display = true;
  }
}
