import {
  Component,
  computed,
  ContentChild,
  ContentChildren,
  inject,
  OnInit,
  signal,
  ViewChild,
} from '@angular/core';
import { AppPrimengModule } from '@shared/app-primeng/app-primeng.module';
import { BotonRegresarComponent } from '@shared/components/boton-regresar/boton-regresar.component';
import { HeaderComponent } from '@shared/components/header/header.component';
import { DatetimePipe } from '@shared/pipes/datetime.pipe';
import { StatusBinaryReadOnlyComponent } from '@shared/components/status-binary-read-only/status-binary-read-only.component';
import { SalidaMaterialApiService } from '../service/salida-material.service';
import { SalidaMaterialResponse } from '../service/salida-material.response';
import { Router, ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-principal',
  imports: [
    BotonRegresarComponent,
    HeaderComponent,
    AppPrimengModule,
    DatetimePipe,
    StatusBinaryReadOnlyComponent,
    CommonModule
  ],
  templateUrl: './principal.component.html',
  styleUrl: './principal.component.scss',
})
export class PrincipalComponent implements OnInit {
  update = false;
  salidaMaterialApiService = inject(SalidaMaterialApiService);
  // @ViewChild(RegistrarTipoImpuestoComponent) registrarComponent!: RegistrarTipoImpuestoComponent;
  // @ViewChild(EditarComponent) editarComponent!: EditarComponent;
  // @ViewChild(EliminarComponent) eliminarComponent!: EliminarComponent;

  listaRegistros = computed( ()=> {
    if(this.salidaMaterialApiService.listAll().length > 0){
      return [...this.salidaMaterialApiService.listAll().map( row => ({
        ...row,
        createdAt:  new Date(row.createdAt),
        updatedAt: (row.updatedAt)?new Date(row.updatedAt):new Date(row.createdAt)
      }))]
    }
    return [];
  })

    constructor(
      private router:Router,
      private route: ActivatedRoute
    ){}

  ngOnInit(): void {
    this.salidaMaterialApiService.getAll().subscribe();
  }
  displayUpdate(itemDto: SalidaMaterialResponse) {
    console.log(itemDto);
            this.router.navigate(['../actualizar/'+itemDto.idOrdenInterna], { relativeTo: this.route });

    // this.editarComponent.itemDto.set({
    //   ...itemDto
    // });
    // this.editarComponent.display = true;
  }
  displayDelete(itemDto: SalidaMaterialResponse) {
    // this.eliminarComponent.itemDto.set({
    //   ...itemDto
    // });
    // this.eliminarComponent.display = true;
  }
  displayCreate() {
        this.router.navigate(['../crear'], { relativeTo: this.route });

    // this.registrarComponent.display = true;
  }
  searchTable(tableComponent: any, $event: any){
    tableComponent.filterGlobal($event.target!.value ?? '', 'contains')
  }
}
