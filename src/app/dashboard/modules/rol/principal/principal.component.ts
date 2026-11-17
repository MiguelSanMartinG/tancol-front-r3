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
} from '@shared/ui/native-table';
import { tap } from 'rxjs';
import { EliminarRolComponent } from '../eliminar/eliminar.component';
import { RolResponseDto } from '../services/dtos/rol.response.dto';
import { RolApiService } from '../services/rol.api.service';

@Component({
  selector: 'app-rol-principal',
  templateUrl: './principal.component.html',
  styleUrl: './principal.component.scss',
  imports: [BotonRegresarComponent, HeaderComponent, AppPrimengModule, EliminarRolComponent, ...NATIVE_TABLE_IMPORTS],
})
export class PrincipalRolComponent implements OnInit, OnDestroy {
  private readonly api = inject(RolApiService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  @ViewChild(EliminarRolComponent) eliminarComponent!: EliminarRolComponent;
  @ViewChild(NativeTableComponent)
  set nativeTable(table: NativeTableComponent | undefined) {
    this.page.table = table;
  }

  readonly columns: NativeColumn<RolResponseDto>[] = [
    { id: 'index', label: 'ID', width: 72, minWidth: 56, sortable: false, tooltip: false, align: 'left' },
    { id: 'name', label: 'Nombre', field: 'name', width: 320, filter: { type: 'text' }, align: 'center' },
    { id: 'acciones', label: 'Acciones', width: 160, minWidth: 150, sortable: false, tooltip: false, align: 'center' },
  ];

  /** Última lista recibida del servidor; si el servicio cambia `listAll` (p. ej. al eliminar), se recarga. */
  private lastList: unknown = this.api.listAll();
  private readonly source = localPageSource<RolResponseDto>(
    () => this.api.getAll().pipe(tap((list) => (this.lastList = list))),
    this.columns,
  );
  readonly page = new CatalogTableState<RolResponseDto>(this.source.request);

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

  displayUpdate(item: RolResponseDto): void {
    this.router.navigate(['../actualizar', item.id], { relativeTo: this.route });
  }

  displayPermissions(item: RolResponseDto): void {
    this.router.navigate(['../permisos', item.id], { relativeTo: this.route });
  }

  displayDelete(item: RolResponseDto): void {
    this.eliminarComponent.itemDto.set({ ...item });
    this.eliminarComponent.display = true;
  }
}
