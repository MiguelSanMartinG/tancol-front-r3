import { CommonModule } from '@angular/common';
import { Component, OnInit, ViewChild, inject, computed } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AppPrimengModule } from '@shared/app-primeng/app-primeng.module';
import { BotonRegresarComponent } from '@shared/components/boton-regresar/boton-regresar.component';
import { HeaderComponent } from '@shared/components/header/header.component';
import { ModuloApiService } from '../services/modulo.api.service';
import { ModuloResponseDto } from '../services/dtos/modulo.response.dto';
import { EliminarComponent } from '../eliminar/eliminar.component';

@Component({
  selector: 'app-modulo-principal',
  templateUrl: './principal.component.html',
  styleUrl: './principal.component.scss',
  imports: [
    CommonModule,
    BotonRegresarComponent,
    HeaderComponent,
    AppPrimengModule,
    EliminarComponent,
  ],
})
export class PrincipalModuloComponent implements OnInit {
  moduloApiService = inject(ModuloApiService);
  router = inject(Router);
  route = inject(ActivatedRoute);
  @ViewChild(EliminarComponent) eliminarComponent!: EliminarComponent;

  listaRegistros = computed(() => this.moduloApiService.listAll());

  ngOnInit(): void {
    this.moduloApiService.getAll().subscribe();
  }

  displayUpdate(item: ModuloResponseDto) {
    this.router.navigate(['../actualizar', item.idModulo], { relativeTo: this.route });
  }

  displayDelete(item: ModuloResponseDto) {
    this.eliminarComponent.itemDto.set({ ...item });
    this.eliminarComponent.display = true;
  }

  displayCreate() {
    this.router.navigate(['../crear'], { relativeTo: this.route });
  }

  searchTable(table: any, event: any) {
    table.filterGlobal(event.target!.value ?? '', 'contains');
  }
}
