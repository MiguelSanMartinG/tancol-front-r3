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
import { EditarComponent } from '../editar/editar.component';
import { RegistrarCategoriaProductoComponent } from '../registrar/registrar.component';
import { CategoriaProductoApiService } from '../services/categoria-producto.api.service';
import { DatetimePipe } from '@shared/pipes/datetime.pipe';
import { StatusBinaryReadOnlyComponent } from '@shared/components/status-binary-read-only/status-binary-read-only.component';
import { CategoriaProductoResponseDto } from '../services/dtos/categoria-producto.response.dto';
import { EliminarComponent } from '../eliminar/eliminar.component';
import { CommonModule } from '@angular/common';
import { DateTimeFormatService } from '@shared/services/date-time-format.service';

@Component({
  selector: 'app-principal',
  imports: [
    BotonRegresarComponent,
    HeaderComponent,
    AppPrimengModule,
    RegistrarCategoriaProductoComponent,
    EditarComponent,
    DatetimePipe,
    StatusBinaryReadOnlyComponent,
    EliminarComponent,
    CommonModule
  ],
  templateUrl: './principal.component.html',
  styleUrl: './principal.component.scss',
})
export class PrincipalComponent implements OnInit {
  update = false;
  expandedRows = signal<Record<string, boolean>>({});
  detalleVisible = false;
  detalleTitulo = '';
  detalle: any = null;
  categoriaProductoApiService = inject(CategoriaProductoApiService);
  arbolCategorias = computed(() => {
    const nodos = new Map(this.categoriaProductoApiService.listAll().map((item) => [item.idCategoria, { ...item, subcategorias: [] as (typeof item & { subcategorias: any[] })[] }]));
    const raices: any[] = [];
    for (const item of this.categoriaProductoApiService.listAll()) {
      const nodo = nodos.get(item.idCategoria)!;
      const padre = item.idCategoriaPadre ? nodos.get(item.idCategoriaPadre) : null;
      if (padre) padre.subcategorias.push(nodo);
      else raices.push(nodo);
    }
    return raices;
  });
  @ViewChild(RegistrarCategoriaProductoComponent) registrarComponent!: RegistrarCategoriaProductoComponent;
  @ViewChild(EditarComponent) editarComponent!: EditarComponent;
  @ViewChild(EliminarComponent) eliminarComponent!: EliminarComponent;

  constructor(private dateTimeFormatService: DateTimeFormatService){}

  listaRegistros = computed(() => {
    const rows: any[] = [];
    const visit = (items: any[], depth = 0) => items.forEach((row) => {
      rows.push({
        ...row,
        depth,
        createdAt: new Date(row.createdAt),
        updatedAt: row.updatedAt ? new Date(row.updatedAt) : new Date(row.createdAt),
        createdAtStr: this.dateTimeFormatService.format(row.createdAt),
        updatedAtStr: this.dateTimeFormatService.format(row.updatedAt ? row.updatedAt : row.createdAt),
      });
      if (this.expandedRows()[row.idCategoria]) visit(row.subcategorias, depth + 1);
    });
    visit(this.arbolCategorias());
    return rows;
  });
  ngOnInit(): void {
    this.categoriaProductoApiService.getAll().subscribe((categorias) => {
      const padresConHijas = new Set(categorias.map((categoria) => categoria.idCategoriaPadre).filter((id): id is string => !!id));
      this.expandedRows.set(Object.fromEntries([...padresConHijas].map((id) => [id, true])));
    });
  }
  displayUpdate(itemDto: CategoriaProductoResponseDto) {
    this.editarComponent.itemDto.set({
      ...itemDto
    });
    this.editarComponent.display = true;
  }
  displayDelete(itemDto: CategoriaProductoResponseDto) {
    this.eliminarComponent.itemDto.set({
      ...itemDto
    });
    this.eliminarComponent.display = true;
  }
  displayCreate() {
    this.registrarComponent.display = true;
  }
  toggleRow(item: { idCategoria: string }) {
    this.expandedRows.update((rows) => ({ ...rows, [item.idCategoria]: !rows[item.idCategoria] }));
  }
  searchTable(tableComponent: any, $event: any){
    tableComponent.filterGlobal($event.target!.value ?? '', 'contains')
  }

  verProductos(item: CategoriaProductoResponseDto) {
    this.categoriaProductoApiService.getProductos(item.idCategoria).subscribe((detalle) => {
      this.detalleTitulo = `Productos de ${item.nombre}`;
      this.detalle = detalle;
      this.detalleVisible = true;
    }, (error) => this.mostrarError(error));
  }

  verRecuento(item: CategoriaProductoResponseDto) {
    this.categoriaProductoApiService.getRecuento(item.idCategoria).subscribe((detalle) => {
      this.detalleTitulo = `Recuento de ${item.nombre}`;
      this.detalle = detalle;
      this.detalleVisible = true;
    }, (error) => this.mostrarError(error));
  }

  verExistencia(item: CategoriaProductoResponseDto) {
    this.categoriaProductoApiService.getExistencia(item.idCategoria).subscribe((detalle) => {
      this.detalleTitulo = `Existencia de ${item.nombre}`;
      this.detalle = detalle;
      this.detalleVisible = true;
    }, (error) => this.mostrarError(error));
  }

  private mostrarError(error: any) {
    this.detalleTitulo = 'No se pudo cargar el detalle';
    this.detalle = { error: error?.error?.message || 'Intenta nuevamente.' };
    this.detalleVisible = true;
  }
}
