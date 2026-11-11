import { CommonModule } from '@angular/common';
import { Component, computed, inject, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AppPrimengModule } from '@shared/app-primeng/app-primeng.module';
import { BotonRegresarComponent } from '@shared/components/boton-regresar/boton-regresar.component';
import { HeaderComponent } from '@shared/components/header/header.component';
import { FueraEspecificacionApiService } from '../services/fuera-especificacion.api.service';
import { FueraEspecificacionResponse } from '../services/fuera-especificacion-response';
import { EliminarFueraEspecificacionComponent } from '../eliminar/eliminar.component';
import { DateTimeFormatService } from '@shared/services/date-time-format.service';
import { DatetimePipe } from '@shared/pipes/datetime.pipe';

@Component({
  selector: 'app-principal-fuera-especificacion',
  templateUrl: './principal.component.html',
  imports: [
    CommonModule,
    BotonRegresarComponent,
    HeaderComponent,
    AppPrimengModule,
    EliminarFueraEspecificacionComponent,
    DatetimePipe,
  ],
  // styleUrl: './principal.component.scss',
})
export class PrincipalFueraEspecificacionComponent {
  apiService = inject(FueraEspecificacionApiService);
  dateTimeFormatService = inject(DateTimeFormatService);
  @ViewChild(EliminarFueraEspecificacionComponent) eliminarComponent!: EliminarFueraEspecificacionComponent;
  constructor(private router: Router, private route: ActivatedRoute) {}

  // listaRegistros = computed(() => this.apiService.listAll());

    listaRegistros = computed(() => {
      if (this.apiService.listAll().length > 0) {
        return [
          ...this.apiService.listAll().map((row) => ({
            ...row,
            updatedAt: row.updatedAt ? row.updatedAt : row.createdAt,
            createdAtStr: this.dateTimeFormatService.format(row.createdAt),
            updatedAtStr: this.dateTimeFormatService.format(
              row.updatedAt ? row.updatedAt : row.createdAt
            ),
          })),
        ];
      }
      return [];
    });



  ngOnInit(): void {
    this.apiService.getAll().subscribe();
  }

  displayUpdate(item: FueraEspecificacionResponse) {
    this.router.navigate(['../actualizar', item.id], { relativeTo: this.route });
  }

  displayDelete(item: FueraEspecificacionResponse) {
    this.eliminarComponent.itemDto.set({ ...item });
    this.eliminarComponent.display = true;
  }

  displayCreate() {
    this.router.navigate(['../crear'], { relativeTo: this.route });
  }

  searchTable(tableComponent: any, $event: any) {
    tableComponent.filterGlobal($event.target!.value ?? '', 'contains');
  }
}
