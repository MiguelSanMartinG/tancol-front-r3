import { CommonModule } from '@angular/common';
import { Component, computed, inject, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AppPrimengModule } from '@shared/app-primeng/app-primeng.module';
import { BotonRegresarComponent } from '@shared/components/boton-regresar/boton-regresar.component';
import { HeaderComponent } from '@shared/components/header/header.component';
import { StatusBinaryReadOnlyComponent } from '@shared/components/status-binary-read-only/status-binary-read-only.component';
import { DatetimePipe } from '@shared/pipes/datetime.pipe';
import { RegistrarComponent } from '../../departamento/registrar/registrar.component';
import { CategoriaNuestrosProductosApiService } from '../service/categoria-nuestros-productos-api.service';
import { CategoriaNuestrosProductosResponse } from '../service/categoria-nuestros-productos.response';
import { EliminarComponent } from '../eliminar/eliminar.component';
import { DateTimeFormatService } from '@shared/services/date-time-format.service';



@Component({
  selector: 'app-principal',
  templateUrl: './principal.component.html',
  // styles: [':host{display:contents}'], // Makes component host as if it was not there, can offer less css headaches. Use @HostBinding class approach for easier overrides.
  // host: { class: 'contents' },
  imports: [
    CommonModule,
    BotonRegresarComponent,
    HeaderComponent,
    AppPrimengModule,
    RegistrarComponent,
    DatetimePipe,
    StatusBinaryReadOnlyComponent,
    EliminarComponent,
  ],
  styleUrl: './principal.component.scss',

})
export class PrincipalComponent {
  // @HostBinding('class') protected readonly class = 'contents'; // Makes component host as if it was not there, can offer less css headaches. Assumes .contents{display:contents} css class exits
  update = false;
  categoriaNuestrosProductos = inject(CategoriaNuestrosProductosApiService);
  @ViewChild(EliminarComponent) eliminarComponent!: EliminarComponent;
  dateTimeFormatService = inject(DateTimeFormatService);
  tableList:TableListCliente[] = []

  constructor(
    private router:Router,
    private route: ActivatedRoute
  ){}

listaRegistros = computed(() => {
  const data = this.categoriaNuestrosProductos.listAll();
  if (data.length > 0) {
    return data.map(row => ({
      id: row.idCategoriaComercial,
      nombre: row.nombre,
      enabled: row.enabled,
      createdAt: new Date(row.createdAt),
      updatedAt: row.updatedAt ? new Date(row.updatedAt) : new Date(row.createdAt),
      createdAtStr: this.dateTimeFormatService.format(row.createdAt),
      updatedAtStr: this.dateTimeFormatService.format(row.updatedAt ? row.updatedAt : row.createdAt),
      data: row
    }));
  }
  return [];
});





  ngOnInit(): void {
    this.categoriaNuestrosProductos.getAll().subscribe();
  }
  displayUpdate(itemDto: CategoriaNuestrosProductosResponse) {
    this.router.navigate(['../actualizar/',itemDto.idCategoriaComercial], { relativeTo: this.route });

  }
  displayDelete(itemDto: CategoriaNuestrosProductosResponse) {
    this.eliminarComponent.itemDto.set({
      ...itemDto
    });
    this.eliminarComponent.display = true;
  }
  displayCreate() {
    this.router.navigate(['../crear'], { relativeTo: this.route });

  }
  searchTable(tableComponent: any, $event: any){
    tableComponent.filterGlobal($event.target!.value ?? '', 'contains')
  }

}

export interface TableListCliente{
  nombreComercial:string;
  razonSocial:string;
  tipoCliente:string;
  telefono:string;
  clienteDesde:string;
  creado:string;
  modificado:string;
  id:string;
}
