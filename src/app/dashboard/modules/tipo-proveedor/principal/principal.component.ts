import {
  Component,
  computed,
  inject,
  OnInit,
  ViewChild,
} from '@angular/core';
import { AppPrimengModule } from '@shared/app-primeng/app-primeng.module';
import { BotonRegresarComponent } from '@shared/components/boton-regresar/boton-regresar.component';
import { HeaderComponent } from '@shared/components/header/header.component';
import { StatusBinaryReadOnlyComponent } from '@shared/components/status-binary-read-only/status-binary-read-only.component';
import { RegistrarComponent } from '../registrar/registrar.component';
import { ActivatedRoute, Router } from '@angular/router';
import { TipoProveedorApiService } from '../services/tipo-proveedor.api.service';
import { TipoProveedorResponseDto } from '../services/dtos/tipo-proveedor.response.dto';
import { EliminarComponent } from '../eliminar/eliminar.component';
import { ImportFileComponent } from '@shared/components/import-file/import-file.component';
import { CommonModule } from '@angular/common';
import { DateTimeFormatService } from '@shared/services/date-time-format.service';

@Component({
  selector: 'app-principal',
  imports: [
    BotonRegresarComponent,
    HeaderComponent,
    AppPrimengModule,
    RegistrarComponent,
    StatusBinaryReadOnlyComponent,
    EliminarComponent,
    ImportFileComponent,
    CommonModule
  ],
  templateUrl: './principal.component.html',
  styleUrl: './principal.component.scss',
})


export class PrincipalComponent implements OnInit {
  update = false;
  tipoProveedorApiService = inject(TipoProveedorApiService);
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
  titleDownload: 'Proveedores',
};

  constructor(
    private router:Router,
    private route: ActivatedRoute,
    private dateTimeFormatService: DateTimeFormatService 
  ){
        this.configurationImport.service = <any> this.tipoProveedorApiService

  }

  listaRegistros = computed( ()=> {
    if(this.tipoProveedorApiService.listAll().length > 0){
      console.log('---',this.tipoProveedorApiService.listAll);
      return [...this.tipoProveedorApiService.listAll().map( row => (
        
        {
        ...row,
        createdAt:  new Date(row.createdAt),
        updatedAt: (row.updatedAt != null)?new Date(row.updatedAt):new Date(row.createdAt),
        createdAtStr: this.dateTimeFormatService.format(row.createdAt),
        updatedAtStr: this.dateTimeFormatService.format((row.updatedAt)?row.updatedAt:row.createdAt)
      }))]
    }
    return [];
  })
  ngOnInit(): void {
    this.tipoProveedorApiService.getAll().subscribe();
  }
  displayUpdate(itemDto: TipoProveedorResponseDto) {
    this.router.navigate(['../actualizar/',itemDto.id], { relativeTo: this.route });

  }
  displayDelete(itemDto: TipoProveedorResponseDto) {
    this.eliminarComponent.itemDto.set({
      ...itemDto,
    });
    this.eliminarComponent.display = true;
  }
  displayCreate() {
    this.router.navigate(['../crear'], { relativeTo: this.route });

  }
  searchTable(tableComponent: any, $event: any){
    console.log($event.target!.value);
    tableComponent.filterGlobal($event.target!.value ?? '', 'contains')
  }
    deleteall(){
    for (const element of this.listaRegistros()) {
      this.tipoProveedorApiService.delete(element.id).subscribe({
        next:(response)=>{
          console.log(response);
        }
      })
    }
  }
}
