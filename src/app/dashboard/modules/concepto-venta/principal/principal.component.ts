import { CommonModule } from '@angular/common';
import { Component, computed, inject, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AppPrimengModule } from '@shared/app-primeng/app-primeng.module';
import { BotonRegresarComponent } from '@shared/components/boton-regresar/boton-regresar.component';
import { HeaderComponent } from '@shared/components/header/header.component';
import { StatusBinaryReadOnlyComponent } from '@shared/components/status-binary-read-only/status-binary-read-only.component';
import { ConceptoVentaApiService } from '../services/concepto-venta.api.service';
import { ConceptoVentaResponseDto } from '../services/dtos/concepto-venta.response.dto';
import { EliminarComponent } from '../eliminar/eliminar.component';
import { DateTimeFormatService } from '@shared/services/date-time-format.service';

@Component({
  selector: 'app-principal-concepto-venta',
  templateUrl: './principal.component.html',
  imports: [
    CommonModule,
    BotonRegresarComponent,
    HeaderComponent,
    AppPrimengModule,
    StatusBinaryReadOnlyComponent,
    EliminarComponent,
  ],
})
export class PrincipalConceptoVentaComponent implements OnInit {
  apiService = inject(ConceptoVentaApiService);
  dateTimeFormatService = inject(DateTimeFormatService);
  router = inject(Router);
  route = inject(ActivatedRoute);
  @ViewChild(EliminarComponent) eliminarComponent!: EliminarComponent;

  listaRegistros = computed(() => {
    if (this.apiService.listAll().length > 0) {
      return [
        ...this.apiService.listAll().map((row) => ({
          ...row,
          createdAtStr: this.dateTimeFormatService.format(row.createdAt),
          updatedAtStr: this.dateTimeFormatService.format(row.updatedAt ?? row.createdAt),
        })),
      ];
    }
    return [];
  });

  ngOnInit(): void {
    this.apiService.getAll().subscribe();
  }

  displayCreate() {
    this.router.navigate(['../crear'], { relativeTo: this.route });
  }

  displayUpdate(item: ConceptoVentaResponseDto) {
    this.router.navigate(['../actualizar', item.id], { relativeTo: this.route });
  }

  displayDelete(item: ConceptoVentaResponseDto) {
    this.eliminarComponent.itemDto.set({ ...item });
    this.eliminarComponent.display = true;
  }

  searchTable(table: any, $event: any) {
    table.filterGlobal($event.target?.value ?? '', 'contains');
  }
}
