import { CommonModule } from '@angular/common';
import { Component, computed, inject, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AppPrimengModule } from '@shared/app-primeng/app-primeng.module';
import { BotonRegresarComponent } from '@shared/components/boton-regresar/boton-regresar.component';
import { HeaderComponent } from '@shared/components/header/header.component';
import { DatetimePipe } from '@shared/pipes/datetime.pipe';
import { EquipoApiService } from '../services/equipo.api.service';
import { EquipoResponse } from '../services/equipo.response';
import { EquipoEliminarComponent } from '../eliminar/eliminar.component';

@Component({
  selector: 'app-equipo-principal',
  templateUrl: './principal.component.html',
  styleUrl: './principal.component.scss',
  imports: [CommonModule, AppPrimengModule, BotonRegresarComponent, HeaderComponent, DatetimePipe, EquipoEliminarComponent],
})
export class EquipoPrincipalComponent implements OnInit {
  api = inject(EquipoApiService);
  router = inject(Router);
  route = inject(ActivatedRoute);
  @ViewChild(EquipoEliminarComponent) eliminarComponent!: EquipoEliminarComponent;

  listaRegistros = computed(() => this.api.listAll().map(item => ({
    ...item,
    tipoEquipoNombre: item.tipoEquipo?.nombre ?? '',
    clienteAsignadoNombre: item.clienteAsignado?.nombreComercial ?? '',
    createdAtDate: new Date(item.createdAt),
    updatedAtDate: new Date(item.updatedAt || item.createdAt),
  })));

  ngOnInit() { this.api.getAll().subscribe(); }
  crear() { this.router.navigate(['../crear'], { relativeTo: this.route }); }
  editar(item: EquipoResponse) { this.router.navigate(['../actualizar', item.id], { relativeTo: this.route }); }
  eliminar(item: EquipoResponse) { this.eliminarComponent.item.set(item); this.eliminarComponent.display = true; }
  buscar(table: any, event: Event) { table.filterGlobal((event.target as HTMLInputElement).value ?? '', 'contains'); }
}
