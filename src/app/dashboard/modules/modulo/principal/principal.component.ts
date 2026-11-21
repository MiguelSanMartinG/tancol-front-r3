import { Component, effect, inject, OnDestroy, OnInit, untracked, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AppPrimengModule } from '@shared/app-primeng/app-primeng.module';
import { BotonRegresarComponent } from '@shared/components/boton-regresar/boton-regresar.component';
import { HeaderComponent } from '@shared/components/header/header.component';
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
import { ModuloResponseDto } from '../services/dtos/modulo.response.dto';
import { ModuloApiService } from '../services/modulo.api.service';

@Component({
  selector: 'app-modulo-principal',
  templateUrl: './principal.component.html',
  styleUrl: './principal.component.scss',
  imports: [BotonRegresarComponent, HeaderComponent, AppPrimengModule, EliminarComponent, ...NATIVE_TABLE_IMPORTS],
})
export class PrincipalModuloComponent implements OnInit, OnDestroy {
  private readonly api = inject(ModuloApiService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  @ViewChild(EliminarComponent) eliminarComponent!: EliminarComponent;
  @ViewChild(NativeTableComponent)
  set nativeTable(table: NativeTableComponent | undefined) {
    this.page.table = table;
  }

  readonly columns: NativeColumn<ModuloResponseDto>[] = [
    { id: 'index', label: 'ID', width: 72, minWidth: 56, sortable: false, tooltip: false, align: 'left' },
    { id: 'name', label: 'Nombre', field: 'name', width: 240, filter: { type: 'text' }, align: 'left' },
    { id: 'parent', label: 'Padre', width: 220, filter: { type: 'text' }, align: 'left' },
    { id: 'ruta', label: 'Ruta', field: 'ruta', width: 260, filter: { type: 'text' }, align: 'left' },
    { id: 'acciones', label: 'Acciones', width: 120, minWidth: 112, sortable: false, tooltip: false, align: 'center' },
  ];

  /** Última lista recibida del servidor; si el servicio cambia `listAll` (p. ej. al eliminar), se recarga. */
  private lastList: unknown = this.api.listAll();
  private readonly source = localPageSource<ModuloResponseDto>(
    () => this.api.getAll().pipe(tap((list) => (this.lastList = list))),
    this.columns,
    { value: (row, key) => (key === 'parent' ? row.parent?.name : readPath(row, key)) },
  );
  readonly page = new CatalogTableState<ModuloResponseDto>(this.source.request);

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

  displayUpdate(item: ModuloResponseDto): void {
    this.router.navigate(['../actualizar', item.idModulo], { relativeTo: this.route });
  }

  displayDelete(item: ModuloResponseDto): void {
    this.eliminarComponent.itemDto.set({ ...item });
    this.eliminarComponent.display = true;
  }
}
