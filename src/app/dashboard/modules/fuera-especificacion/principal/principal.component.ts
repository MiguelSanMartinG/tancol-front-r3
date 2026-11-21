import { Component, effect, inject, OnDestroy, OnInit, untracked, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AppPrimengModule } from '@shared/app-primeng/app-primeng.module';
import { BotonRegresarComponent } from '@shared/components/boton-regresar/boton-regresar.component';
import { HeaderComponent } from '@shared/components/header/header.component';
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
import { EliminarFueraEspecificacionComponent } from '../eliminar/eliminar.component';
import { FueraEspecificacionResponse } from '../services/fuera-especificacion-response';
import { FueraEspecificacionApiService } from '../services/fuera-especificacion.api.service';

@Component({
  selector: 'app-principal-fuera-especificacion',
  templateUrl: './principal.component.html',
  styleUrl: './principal.component.scss',
  imports: [
    BotonRegresarComponent,
    HeaderComponent,
    AppPrimengModule,
    EliminarFueraEspecificacionComponent,
    DatetimePipe,
    ...NATIVE_TABLE_IMPORTS,
  ],
})
export class PrincipalFueraEspecificacionComponent implements OnInit, OnDestroy {
  private readonly api = inject(FueraEspecificacionApiService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  @ViewChild(EliminarFueraEspecificacionComponent) eliminarComponent!: EliminarFueraEspecificacionComponent;
  @ViewChild(NativeTableComponent)
  set nativeTable(table: NativeTableComponent | undefined) {
    this.page.table = table;
  }

  readonly columns: NativeColumn<FueraEspecificacionResponse>[] = [
    { id: 'index', label: 'ID', width: 72, minWidth: 56, sortable: false, tooltip: false, align: 'left' },
    { id: 'motivo', label: 'Motivo', field: 'motivo', width: 320, filter: { type: 'text' }, align: 'left' },
    { id: 'createdAt', label: 'Creado', width: 170, filter: { type: 'date' }, align: 'left' },
    { id: 'updatedAt', label: 'Actualizado', width: 170, filter: { type: 'date' }, align: 'left' },
    { id: 'acciones', label: 'Acciones', width: 120, minWidth: 112, sortable: false, tooltip: false, align: 'center' },
  ];

  /** Última lista recibida del servidor; si el servicio cambia `listAll` (p. ej. al eliminar), se recarga. */
  private lastList: unknown = this.api.listAll();
  private readonly source = localPageSource<FueraEspecificacionResponse>(
    () => this.api.getAll().pipe(tap((list) => (this.lastList = list))),
    this.columns,
    { value: (row, key) => (key === 'updatedAt' ? row.updatedAt || row.createdAt : readPath(row, key)) },
  );
  readonly page = new CatalogTableState<FueraEspecificacionResponse>(this.source.request);

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

  displayUpdate(item: FueraEspecificacionResponse): void {
    this.router.navigate(['../actualizar', item.id], { relativeTo: this.route });
  }

  displayDelete(item: FueraEspecificacionResponse): void {
    this.eliminarComponent.itemDto.set({ ...item });
    this.eliminarComponent.display = true;
  }
}
