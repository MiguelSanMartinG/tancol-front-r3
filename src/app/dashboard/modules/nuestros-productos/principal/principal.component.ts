import { CommonModule } from '@angular/common';
import { Component, computed, inject, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AppPrimengModule } from '@shared/app-primeng/app-primeng.module';
import { BotonRegresarComponent } from '@shared/components/boton-regresar/boton-regresar.component';
import { HeaderComponent } from '@shared/components/header/header.component';
import { StatusBinaryReadOnlyComponent } from '@shared/components/status-binary-read-only/status-binary-read-only.component';
import { DatetimePipe } from '@shared/pipes/datetime.pipe';
import { RegistrarComponent } from '../../departamento/registrar/registrar.component';
import { EliminarComponent } from '../eliminar/eliminar.component';
import { NuestrosProductosService } from '../service/nuestros-productos.service';
import { NuestrosProductosResponse } from '../service/nuestros-productos.response';
import { RegistrarProductoComponent } from '../registrar/registrar.component';
import { EditarComponent } from '../editar/editar.component';



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
        RegistrarProductoComponent,
        EditarComponent
  ],
  styleUrl: './principal.component.scss',

})
export class PrincipalComponent {
  // @HostBinding('class') protected readonly class = 'contents'; // Makes component host as if it was not there, can offer less css headaches. Assumes .contents{display:contents} css class exits
  update = false;
  nuestrosProductos = inject(NuestrosProductosService);
  @ViewChild(EliminarComponent) eliminarComponent!: EliminarComponent;
  tableList:TableListCliente[] = []
  @ViewChild(RegistrarProductoComponent) registrarComponent!: RegistrarProductoComponent;
  @ViewChild(EditarComponent) editarComponent!: EditarComponent;

  constructor(
    private router:Router,
    private route: ActivatedRoute
  ){}

listaRegistros = computed(() => {
  const data = this.nuestrosProductos.listAll();
  if (data.length > 0) {
    return data.map(row => ({
      id: row.idProductoComercial,
      sku: row.sku,
      nombre:row.nombre,
      alias: row.alias,
      precio: row.precio,
      presentacionUnidad: `${row.presentacion} ${row.unidadMedidaDefault.nombre}`,
      enabled:row.enabled,
      createdAt: row.createdAt,
      // enabled: row.enabled,
      updatedAt: row.updatedAt || row.createdAt,
      data:row
    }));
  }
  return [];
});





  ngOnInit(): void {
    this.nuestrosProductos.getAll().subscribe();
  }
  displayUpdate(itemDto: NuestrosProductosResponse) {
    // this.router.navigate(['../actualizar/',itemDto.idProductoComercial], { relativeTo: this.route });
        console.log(itemDto);
    this.editarComponent.itemDto.set({
      ...itemDto
    });
    this.editarComponent.display = true;
  }
  displayDelete(itemDto: NuestrosProductosResponse) {
    this.eliminarComponent.itemDto.set({
      ...itemDto
    });
    this.eliminarComponent.display = true;
  }
  displayCreate() {
    // this.router.navigate(['../crear'], { relativeTo: this.route });
    this.registrarComponent.display = true;

  }
  displayComisiones(item: NuestrosProductosResponse) {
    this.router.navigate(['../comisiones', item.idProductoComercial], { relativeTo: this.route });
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
