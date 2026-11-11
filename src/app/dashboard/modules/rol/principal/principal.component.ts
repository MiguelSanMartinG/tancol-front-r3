import { CommonModule } from '@angular/common';
import { Component, computed, inject, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AppPrimengModule } from '@shared/app-primeng/app-primeng.module';
import { BotonRegresarComponent } from '@shared/components/boton-regresar/boton-regresar.component';
import { HeaderComponent } from '@shared/components/header/header.component';
import { RolApiService } from '../services/rol.api.service';
import { RolResponseDto } from '../services/dtos/rol.response.dto';
import { EliminarRolComponent } from '../eliminar/eliminar.component';

@Component({
  selector: 'app-rol-principal',
  templateUrl: './principal.component.html',
  styleUrl: './principal.component.scss',
  imports: [
    CommonModule,
    BotonRegresarComponent,
    HeaderComponent,
    AppPrimengModule,
    EliminarRolComponent,
  ],
})
export class PrincipalRolComponent implements OnInit {
  rolApiService = inject(RolApiService);
  @ViewChild(EliminarRolComponent) eliminarComponent!: EliminarRolComponent;

  constructor(private router: Router, private route: ActivatedRoute) {}

  listaRegistros = computed(() => this.rolApiService.listAll());

  ngOnInit(): void {
    this.rolApiService.getAll().subscribe();
  }

  displayUpdate(item: RolResponseDto) {
    this.router.navigate(['../actualizar', item.id], { relativeTo: this.route });
  }

  displayDelete(item: RolResponseDto) {
    this.eliminarComponent.itemDto.set({ ...item });
    this.eliminarComponent.display = true;
  }

  displayPermissions(item: RolResponseDto) {
    this.router.navigate(['../permisos', item.id], { relativeTo: this.route });
  }

  displayCreate() {
    this.router.navigate(['../crear'], { relativeTo: this.route });
  }

  searchTable(tableComponent: any, $event: any) {
    tableComponent.filterGlobal($event.target!.value ?? '', 'contains');
  }
}
