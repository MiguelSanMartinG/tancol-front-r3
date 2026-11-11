import { CommonModule } from '@angular/common';
import { Component, OnInit, ViewChild, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AppPrimengModule } from '@shared/app-primeng/app-primeng.module';
import { BotonRegresarComponent } from '@shared/components/boton-regresar/boton-regresar.component';
import { HeaderComponent } from '@shared/components/header/header.component';
import { DatetimePipe } from '@shared/pipes/datetime.pipe';
import { EliminarComponent } from '../eliminar/eliminar.component';
import { MedidorApiService } from '../services/medidor.api.service';
import { MedidorResponseDto } from '../services/dtos/medidor.response.dto';

@Component({
  selector: 'app-medidor-hijos',
  standalone: true,
  imports: [
    CommonModule,
    BotonRegresarComponent,
    HeaderComponent,
    AppPrimengModule,
    DatetimePipe,
    EliminarComponent,
  ],
  templateUrl: './hijos.component.html',
})
export class HijosComponent implements OnInit {
  medidorApi = inject(MedidorApiService);
  route = inject(ActivatedRoute);
  router = inject(Router);
  @ViewChild(EliminarComponent) eliminarComponent!: EliminarComponent;

  idPadre = '';
  medidorPadre = signal<MedidorResponseDto | null>(null);
  medidoresHijos = signal<MedidorResponseDto[]>([]);

  listaRegistros = computed(() => {
    if (this.medidoresHijos().length > 0) {
      return [
        ...this.medidoresHijos().map((row) => ({
          ...row,
          fechaModificacion: row.updatedAt ? row.updatedAt : row.createdAt,
        })),
      ];
    }
    return [];
  });

  ngOnInit(): void {
    this.idPadre = this.route.snapshot.params['id'];
    this.cargar();
  }

  cargar() {
    this.medidorApi.getOne(this.idPadre).subscribe((resp) => {
      this.medidorPadre.set(resp);
      this.medidoresHijos.set(resp.medidoresHijos ?? []);
    });
  }

  displayUpdate(itemDto: MedidorResponseDto) {
    this.router.navigate(['../../actualizar', itemDto.idMedidor], { relativeTo: this.route });
  }
  displayDelete(itemDto: MedidorResponseDto) {
    this.eliminarComponent.itemDto.set({ ...itemDto });
    this.eliminarComponent.display = true;
  }
  displayBitacora(itemDto: MedidorResponseDto) {
    this.router.navigate(['../../bitacora', itemDto.idMedidor], { relativeTo: this.route });
  }
  displayCreate() {
    this.router.navigate(['./crear'], { relativeTo: this.route });
  }
  searchTable(tableComponent: any, $event: any) {
    tableComponent.filterGlobal($event.target!.value ?? '', 'contains');
  }
  onDeleted() {
    this.cargar();
  }
}
