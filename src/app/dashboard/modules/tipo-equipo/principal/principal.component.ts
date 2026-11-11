import { CommonModule } from '@angular/common';
import { Component, computed, inject, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AppPrimengModule } from '@shared/app-primeng/app-primeng.module';
import { BotonRegresarComponent } from '@shared/components/boton-regresar/boton-regresar.component';
import { HeaderComponent } from '@shared/components/header/header.component';
import { DatetimePipe } from '@shared/pipes/datetime.pipe';
import { TipoEquipoApiService } from '../services/tipo-equipo.api.service';
import { TipoEquipoResponse } from '../services/tipo-equipo.response';
import { TipoEquipoEliminarComponent } from '../eliminar/eliminar.component';

@Component({
  selector: 'app-tipo-equipo-principal',
  templateUrl: './principal.component.html',
  styleUrl: './principal.component.scss',
  imports: [CommonModule, AppPrimengModule, BotonRegresarComponent, HeaderComponent, DatetimePipe, TipoEquipoEliminarComponent],
})
export class TipoEquipoPrincipalComponent implements OnInit {
  api = inject(TipoEquipoApiService);
  router = inject(Router);
  route = inject(ActivatedRoute);
  @ViewChild(TipoEquipoEliminarComponent) eliminarComponent!: TipoEquipoEliminarComponent;

  listaRegistros = computed(() => this.api.listAll().map(row => ({
    ...row,
    createdAtDate: new Date(row.createdAt),
    updatedAtDate: new Date(row.updatedAt || row.createdAt),
  })));

  ngOnInit() {
    this.api.getAll().subscribe();
  }

  crear() {
    this.router.navigate(['../crear'], { relativeTo: this.route });
  }

  editar(item: TipoEquipoResponse) {
    this.router.navigate(['../actualizar', item.id], { relativeTo: this.route });
  }

  eliminar(item: TipoEquipoResponse) {
    this.eliminarComponent.item.set(item);
    this.eliminarComponent.display = true;
  }

  buscar(table: any, event: Event) {
    table.filterGlobal((event.target as HTMLInputElement).value ?? '', 'contains');
  }
}
