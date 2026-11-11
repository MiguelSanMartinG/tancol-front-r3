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
import { FormsModule } from '@angular/forms';
import { ImportFileComponent } from "../../../../shared/components/import-file/import-file.component";
import { DialogEliminarTodoComponent } from "../../../../shared/components/dialog-eliminar-todo/dialog-eliminar-todo.component";
import { RegistrarAlmacenComponent } from '../../almacen/registrar/registrar.component';
import { AlmacenApiService } from '../../almacen/services/almacen.api.service';
import { AlmacenResponseDto } from '../../almacen/services/dtos/almacen.response.dto';
import { EditarComponent } from '../../departamento/editar/editar.component';
import { EliminarComponent } from '../../departamento/eliminar/eliminar.component';
import { InventarioService } from '../services/inventario.service';
import { ExcelExportService, ExportColumn } from '@shared/services/excel.export.service';

interface InventarioExportRow {
  almacen: string;
  producto: string;
  cantidad: number;
  unidadMedida: string;
  categoria: string;
  categoriaPadre: string;
  sku: string;
}

@Component({
  selector: 'app-principal',
  imports: [
    BotonRegresarComponent,
    HeaderComponent,
    AppPrimengModule,
    RegistrarAlmacenComponent,
    EditarComponent,
    StatusBinaryReadOnlyComponent,
    EliminarComponent,
    FormsModule,
    ImportFileComponent,
    DatetimePipe,
    DialogEliminarTodoComponent
],
  templateUrl: './principal.component.html',
  styleUrl: './principal.component.scss',
})
export class PrincipalComponent implements OnInit {
  update = false;
  inventarioApiService = inject(InventarioService)
  almacenApiService = inject(AlmacenApiService);
  @ViewChild(RegistrarAlmacenComponent)
  registrarComponent!: RegistrarAlmacenComponent;
  @ViewChild(EditarComponent) editarComponent!: EditarComponent;
  @ViewChild(EliminarComponent) eliminarComponent!: EliminarComponent;
  listaSeleccionada: any[] = [];
  configurationImport = {
    properties: [
      {
        nameProperty: 'id',
        label: 'id',
        column: '',
        id: true,
      },
      {
        nameProperty: 'nombre',
        label: 'Nombre',
        column: '',
        unique: true,
        id: false,
      },
      {
        nameProperty: 'status',
        label: 'Estado',
        column: '',
        id: false,
        update: true
      }
    ],
    columns: [
      { header: 'id', key: 'id', width: 10},
      { header: 'Nombre', key: 'nombre', width: 20 },
      { header: 'Estado', key: 'status', width: 20 },
    ],
    titleDownload: 'almacenes'
  }
  listaRegistros = computed( ()=> {
    if(this.inventarioApiService.listAll().length > 0){
      return [...this.inventarioApiService.listAll().map( row => ({
        ...row,
        createdAt:  new Date(row.createdAt),
        updatedAt: new Date(row.updatedAt)
      }))]
    }
    return [];
  })

  ngOnInit(): void {
    this.inventarioApiService.getAll().subscribe();
  }

  exportar(): void {
    const rows: InventarioExportRow[] = this.inventarioApiService.listAll().map((row: any) => ({
      almacen: row.almacen?.nombre ?? '',
      producto: row.producto?.nombre ?? '',
      cantidad: row.cantidad ?? 0,
      unidadMedida: row.producto?.unidadMedidaDefault?.nombre
        ?? row.producto?.unidadesMedida?.nombre
        ?? row.unidadesMedida?.nombre
        ?? '',
      categoria: row.producto?.categoria?.nombre ?? '',
      categoriaPadre: row.producto?.categoria?.nombreCategoriaPadre ?? '',
      sku: row.producto?.sku ?? '',
    }));
    const columns: ExportColumn<InventarioExportRow>[] = [
      { header: 'Almacén', key: 'almacen', width: 24 },
      { header: 'Producto', key: 'producto', width: 32 },
      { header: 'Cantidad', key: 'cantidad', width: 14 },
      { header: 'Unidad de medida', key: 'unidadMedida', width: 20 },
      { header: 'Categoría', key: 'categoria', width: 24 },
      { header: 'Categoría padre', key: 'categoriaPadre', width: 24 },
      { header: 'SKU', key: 'sku', width: 18 },
    ];
    ExcelExportService.exportAsExcelFile(rows, columns, 'inventario');
  }
  // displayUpdate(itemDto: AlmacenResponseDto) {
  //   this.editarComponent.itemDto.set({
  //     ...itemDto,
  //   });
  //   this.editarComponent.display = true;
  // }
  // displayDelete(itemDto: AlmacenResponseDto) {
  //   this.eliminarComponent.itemDto.set({
  //     ...itemDto,
  //   });
  //   this.eliminarComponent.display = true;
  // }
  displayCreate() {
    this.registrarComponent.display = true;
  }
  searchTable(tableComponent: any, $event: any) {
    tableComponent.filterGlobal($event.target!.value ?? '', 'contains');
  }
  deleteAll(){
    for(const item of this.listaSeleccionada){
      this.almacenApiService.delete(item.id).subscribe((resp:any) => {
        
      });
    }
    this.listaSeleccionada = [];
  }
}
