import { CommonModule } from '@angular/common';
import { Component, computed, inject, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { TipoClienteApiService } from '../services/tipo-cliente.api.service';
import { AppPrimengModule } from '@shared/app-primeng/app-primeng.module';
import { BotonRegresarComponent } from '@shared/components/boton-regresar/boton-regresar.component';
import { HeaderComponent } from '@shared/components/header/header.component';
import { StatusBinaryReadOnlyComponent } from '@shared/components/status-binary-read-only/status-binary-read-only.component';
import { DatetimePipe } from '@shared/pipes/datetime.pipe';
import { RegistrarComponent } from '../../departamento/registrar/registrar.component';
import { TipoClienteResponse } from '../services/tipo-cliente-response';
import { EliminarComponent } from '../eliminar/eliminar.component';
import { ImportFileComponent } from '@shared/components/import-file/import-file.component';
import { of } from 'rxjs';
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
    // RegistrarTipoImpuestoComponent,
    // EditarComponent,
    DatetimePipe,
    StatusBinaryReadOnlyComponent,
    EliminarComponent,
    ImportFileComponent,
    // EliminarComponent
  ],
  styleUrl: './principal.component.scss',

})
export class PrincipalComponent {
  // @HostBinding('class') protected readonly class = 'contents'; // Makes component host as if it was not there, can offer less css headaches. Assumes .contents{display:contents} css class exits
  update = false;
  tipoClienteService = inject(TipoClienteApiService);
  @ViewChild(EliminarComponent) eliminarComponent!: EliminarComponent;
  configurationImport = {
  service:null,
  properties: [
    {
      nameProperty: 'nombre',
      label: 'Nombre',
      column: '',
      unique: true,
      id: false,
      required: true,
      type: 'text',
    },
        {
      label: 'Alias',
      nameProperty: 'alias',
      required: false,
      type: 'text',
    }
    
  ],
  columns: [
    { header: 'Nombre', key: 'nombre', width: 30 },
  ],
  titleDownload: 'clientes',
};

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private dateTimeFormatService: DateTimeFormatService
  ){
    this.configurationImport.service = <any> this.tipoClienteService
  }

  listaRegistros = computed(() => {
    if (this.tipoClienteService.listAll().length > 0) {
      return [
        ...this.tipoClienteService.listAll().map((row) => ({
          ...row,
          createdAt: new Date(row.createdAt),
          updatedAt: row.updatedAt ? new Date(row.updatedAt) : new Date(row.createdAt),
          createdAtStr: this.dateTimeFormatService.format(row.createdAt),
          updatedAtStr: this.dateTimeFormatService.format(row.updatedAt ? row.updatedAt : row.createdAt),
        })),
      ];
    }
    return [];
  });
  ngOnInit(): void {
    this.tipoClienteService.getAll().subscribe();
  }
  displayUpdate(itemDto: TipoClienteResponse) {
    this.router.navigate(['../actualizar/',itemDto.idTiposClientes], { relativeTo: this.route });

  }
  displayDelete(itemDto: TipoClienteResponse) {
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

  deleteall(){
    for (const element of this.listaRegistros()) {
      this.tipoClienteService.delete(element.idTiposClientes).subscribe({
        next:(response)=>{
          console.log(response);
        }
      })
    }
  }

}
