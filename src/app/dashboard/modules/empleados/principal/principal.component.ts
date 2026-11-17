import { CommonModule } from '@angular/common';
import { Component, inject, OnDestroy, OnInit, signal, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AppPrimengModule } from '@shared/app-primeng/app-primeng.module';
import { BotonRegresarComponent } from '@shared/components/boton-regresar/boton-regresar.component';
import { HeaderComponent } from '@shared/components/header/header.component';
import { StatusBinaryReadOnlyComponent } from '@shared/components/status-binary-read-only/status-binary-read-only.component';
import { DatetimePipe } from '@shared/pipes/datetime.pipe';
import {
  CatalogTableState,
  NativeColumn,
  NativeTableComponent,
  NATIVE_TABLE_IMPORTS,
} from '@shared/ui/native-table';
import { MetaVentaApiService } from '../../metas-ventas/services/meta-venta.api.service';
import { MetaVentaRevision } from '../../metas-ventas/services/meta-venta.model';
import { EliminarComponent } from '../eliminar/eliminar.component';
import { EmpleadoApiService } from '../services/empleado.api.service';
import { EmpleadoResponseDto, getEmpleadoNombreCompleto } from '../services/dtos/empleado.response';
import { etiquetaTipoContratacion, requiereVigencia } from '../services/dtos/empleado.create.dto';
import { parsearFechaApi } from '../form/datos-laborales';

/** Días de anticipación con los que la vigencia se marca "por vencer" (igual que el aviso del back). */
const DIAS_AVISO_VIGENCIA = 2;
const MS_DIA = 24 * 60 * 60 * 1000;

export type EstadoVigencia = 'vencida' | 'por-vencer' | 'vigente';

const ESTADO = [
  { value: 'true', label: 'Activo' },
  { value: 'false', label: 'Inactivo' },
];

@Component({
  selector: 'app-principal',
  imports: [
    BotonRegresarComponent,
    HeaderComponent,
    AppPrimengModule,
    DatetimePipe,
    StatusBinaryReadOnlyComponent,
    EliminarComponent,
    CommonModule,
    ...NATIVE_TABLE_IMPORTS,
  ],
  templateUrl: './principal.component.html',
  styleUrl: './principal.component.scss',
})
export class PrincipalComponent implements OnInit, OnDestroy {
  private readonly api = inject(EmpleadoApiService);
  private readonly metasApi = inject(MetaVentaApiService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  readonly page = new CatalogTableState<EmpleadoResponseDto>((query) => this.api.getPage(query));
  readonly revisionMetas = signal<MetaVentaRevision | null>(null);
  dialogRevisionVisible = false;
  @ViewChild(EliminarComponent) eliminarComponent!: EliminarComponent;
  @ViewChild(NativeTableComponent)
  set nativeTable(table: NativeTableComponent | undefined) {
    this.page.table = table;
  }

  readonly columns: NativeColumn<EmpleadoResponseDto>[] = [
    { id: 'index', label: 'ID', width: 72, minWidth: 56, sortable: false, tooltip: false, align: 'left' },
    { id: 'nombreCompleto', label: 'Nombre completo', width: 240, filter: { type: 'text' }, align: 'center' },
    { id: 'tipoEmpleado', label: 'Tipo de empleado', width: 180, filter: { type: 'text' }, align: 'center' },
    { id: 'departamento', label: 'Departamento', width: 180, filter: { type: 'text' }, align: 'center' },
    { id: 'role', label: 'Rol', width: 150, filter: { type: 'text' }, align: 'center' },
    { id: 'tipoContratacion', label: 'Contratación', width: 150, sortable: false, filter: undefined, align: 'center' },
    { id: 'fechaVigencia', label: 'Vigencia', width: 140, sortable: false, filter: undefined, align: 'center' },
    { id: 'createdAt', label: 'Creado', width: 170, filter: { type: 'date' }, align: 'center' },
    { id: 'updatedAt', label: 'Modificado', width: 170, filter: { type: 'date' }, align: 'center' },
    { id: 'enabled', label: 'Estado', width: 120, filter: { type: 'select', options: ESTADO }, align: 'center' },
    { id: 'acciones', label: 'Acciones', width: 210, minWidth: 196, sortable: false, tooltip: false, align: 'center' },
  ];

  ngOnInit(): void {
    this.page.resetAndLoad();
  }

  ngOnDestroy(): void {
    this.page.destroy();
  }

  nombre(row: EmpleadoResponseDto): string {
    return getEmpleadoNombreCompleto(row);
  }

  contratacion(row: EmpleadoResponseDto): string {
    return etiquetaTipoContratacion(row.tipoContratacion);
  }

  /** Vigencia 'dd/MM/yyyy'; vacía si no aplica (De planta o sin fecha). */
  vigencia(row: EmpleadoResponseDto): string {
    const fecha = this.fechaVigencia(row);
    if (!fecha) return '';
    const dia = String(fecha.getDate()).padStart(2, '0');
    const mes = String(fecha.getMonth() + 1).padStart(2, '0');
    return `${dia}/${mes}/${fecha.getFullYear()}`;
  }

  estadoVigencia(row: EmpleadoResponseDto): EstadoVigencia | null {
    const fecha = this.fechaVigencia(row);
    if (!fecha) return null;
    const ahora = new Date();
    const hoy = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate());
    const dias = Math.round((fecha.getTime() - hoy.getTime()) / MS_DIA);
    if (dias < 0) return 'vencida';
    if (dias <= DIAS_AVISO_VIGENCIA) return 'por-vencer';
    return 'vigente';
  }

  private fechaVigencia(row: EmpleadoResponseDto): Date | null {
    if (!requiereVigencia(row.tipoContratacion)) return null;
    return parsearFechaApi(row.fechaVigencia);
  }

  displayCreate(): void {
    this.router.navigate(['../crear'], { relativeTo: this.route });
  }

  displayUpdate(item: EmpleadoResponseDto): void {
    this.router.navigate(['../actualizar', item.idEmpleado], { relativeTo: this.route });
  }

  displayDelete(item: EmpleadoResponseDto): void {
    this.eliminarComponent.itemDto.set({ ...item });
    this.eliminarComponent.display = true;
  }

  displayMetas(item: EmpleadoResponseDto): void {
    this.router.navigate(['../metas-ventas', item.idEmpleado], { relativeTo: this.route });
  }

  displayProductoRoto(item: EmpleadoResponseDto): void {
    this.router.navigate(['../producto-roto', item.idEmpleado], { relativeTo: this.route });
  }

  revisarMetas(): void {
    this.metasApi.revisar().subscribe((resultado) => {
      this.revisionMetas.set(resultado);
      this.dialogRevisionVisible = true;
    });
  }
}
