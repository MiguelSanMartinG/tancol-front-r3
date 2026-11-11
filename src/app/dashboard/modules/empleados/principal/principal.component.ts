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
import { ActivatedRoute, Router } from '@angular/router';
import { EmpleadoApiService } from '../services/empleado.api.service';
import { EmpleadoResponseDto, getEmpleadoNombreCompleto } from '../services/dtos/empleado.response';
import { EliminarComponent } from '../eliminar/eliminar.component';
import { CommonModule } from '@angular/common';
import { MetaVentaApiService } from '../../metas-ventas/services/meta-venta.api.service';
import { MetaVentaRevision } from '../../metas-ventas/services/meta-venta.model';

@Component({
  selector: 'app-principal',
  imports: [
    BotonRegresarComponent,
    HeaderComponent,
    AppPrimengModule,
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
  EmpleadoApiService = inject(EmpleadoApiService);
  private readonly metasApi = inject(MetaVentaApiService);
  @ViewChild(EliminarComponent) eliminarComponent!: EliminarComponent;
  revisionMetas = signal<MetaVentaRevision | null>(null);
  dialogRevisionVisible = false;

  constructor(
    private router:Router,
    private route: ActivatedRoute
  ){}

  listaRegistros = computed(() => {
    if (this.EmpleadoApiService.listAll().length > 0) {
      console.log('---', this.EmpleadoApiService.listAll);
      return [...this.EmpleadoApiService.listAll().map((row) => ({
        ...row,
        nombreCompleto: getEmpleadoNombreCompleto(row),
        updatedAt: row.updatedAt ? row.updatedAt : row.createdAt,
      }))].sort((a, b) => {
        if (a.enabled !== b.enabled) {
          return a.enabled ? -1 : 1;
        }

        return a.nombreCompleto.localeCompare(b.nombreCompleto, 'es', { sensitivity: 'base' });
      });
    }
    return [];
  })
  ngOnInit(): void {
    this.EmpleadoApiService.getAll().subscribe();
  }
  displayUpdate(itemDto: EmpleadoResponseDto) {
    this.router.navigate(['../actualizar/',itemDto.idEmpleado], { relativeTo: this.route });

  }
  displayDelete(itemDto: EmpleadoResponseDto) {
    console.log(itemDto);
    this.eliminarComponent.itemDto.set({
      ...itemDto
    });
    this.eliminarComponent.display = true;
  }
  displayCreate() {
    this.router.navigate(['../crear'], { relativeTo: this.route });

  }
  displayMetas(itemDto: EmpleadoResponseDto) {
    this.router.navigate(['../metas-ventas', itemDto.idEmpleado], { relativeTo: this.route });
  }
  displayProductoRoto(itemDto: EmpleadoResponseDto) {
    this.router.navigate(['../producto-roto', itemDto.idEmpleado], { relativeTo: this.route });
  }
  revisarMetas() {
    this.metasApi.revisar().subscribe((resultado) => {
      this.revisionMetas.set(resultado);
      this.dialogRevisionVisible = true;
    });
  }
  searchTable(tableComponent: any, $event: any){
    const search = ($event?.target?.value ?? '').toString().trim();
    tableComponent.filterGlobal(search, 'contains');
  }
}
