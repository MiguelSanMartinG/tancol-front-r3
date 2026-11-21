import { Component, inject, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { TagModule } from 'primeng/tag';
import { AppPrimengModule } from '@shared/app-primeng/app-primeng.module';
import { BotonRegresarComponent } from '@shared/components/boton-regresar/boton-regresar.component';
import { HeaderComponent } from '@shared/components/header/header.component';
import { DatetimePipe } from '@shared/pipes/datetime.pipe';
import {
  CatalogTableState,
  FilterOption,
  NativeColumn,
  NativeTableComponent,
  NATIVE_TABLE_IMPORTS,
} from '@shared/ui/native-table';
import { SalidaMaterialResponse } from '../service/salida-material.response';
import { SalidaMaterialApiService } from '../service/salida-material.service';

type Severidad = 'success' | 'secondary' | 'info' | 'warn' | 'danger' | 'contrast';

/** Estados conocidos de la orden interna (salida de material) → etiqueta legible y color del chip. */
const ESTADOS: Record<string, { label: string; severity: Severidad }> = {
  EN_USO: { label: 'En uso', severity: 'info' },
  BORRADOR: { label: 'Borrador', severity: 'warn' },
  PENDIENTE: { label: 'Pendiente', severity: 'info' },
  ENTREGADO: { label: 'Entregado', severity: 'success' },
  ENTREGADA: { label: 'Entregada', severity: 'success' },
  DEVUELTO: { label: 'Devuelto', severity: 'success' },
  COMPLETADO: { label: 'Completado', severity: 'success' },
  COMPLETADA: { label: 'Completada', severity: 'success' },
  FINALIZADO: { label: 'Finalizado', severity: 'success' },
  FINALIZADA: { label: 'Finalizada', severity: 'success' },
  CERRADO: { label: 'Cerrado', severity: 'secondary' },
  CERRADA: { label: 'Cerrada', severity: 'secondary' },
  CANCELADO: { label: 'Cancelado', severity: 'danger' },
  CANCELADA: { label: 'Cancelada', severity: 'danger' },
};

/** Valores de EstadoOrdenInterna en el back; el filtro de la columna se resuelve en el servidor. */
const ESTADOS_ORDEN_INTERNA = ['EN_USO', 'BORRADOR', 'EN_ALMACEN', 'SIN_RETORNO', 'MALA_CONDICION'];

/** 'EN USO' / 'en_uso' / 'EN_USO' → 'EN_USO'. */
function claveEstado(estado: unknown): string {
  return String(estado ?? '').trim().toUpperCase().replace(/\s+/g, '_');
}

function etiquetaEstado(estado: unknown): string {
  const clave = claveEstado(estado);
  if (!clave) return '';
  const conocido = ESTADOS[clave];
  if (conocido) return conocido.label;
  const texto = clave.replace(/_/g, ' ').toLowerCase();
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

@Component({
  selector: 'app-principal',
  imports: [
    BotonRegresarComponent,
    HeaderComponent,
    AppPrimengModule,
    TagModule,
    DatetimePipe,
    ...NATIVE_TABLE_IMPORTS,
  ],
  templateUrl: './principal.component.html',
  styleUrl: './principal.component.scss',
})
export class PrincipalComponent implements OnInit, OnDestroy {
  readonly salidaMaterialApiService = inject(SalidaMaterialApiService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  @ViewChild(NativeTableComponent)
  set nativeTable(table: NativeTableComponent | undefined) {
    this.page.table = table;
  }

  /** Opciones del filtro Estado: todos los valores del enum del back (EstadoOrdenInterna). */
  readonly columns: NativeColumn<SalidaMaterialResponse>[] = this.buildColumns(
    ESTADOS_ORDEN_INTERNA.map((value) => ({ value, label: etiquetaEstado(value) })),
  );

  /** Paginación, filtros, búsqueda y orden en el servidor (GET orden-interna/page). */
  readonly page = new CatalogTableState<SalidaMaterialResponse>((query) => this.salidaMaterialApiService.getPage(query));

  ngOnInit(): void {
    this.page.resetAndLoad();
  }

  ngOnDestroy(): void {
    this.page.destroy();
  }

  estadoLabel(estado: unknown): string {
    return etiquetaEstado(estado);
  }

  estadoSeverity(estado: unknown): Severidad {
    return ESTADOS[claveEstado(estado)]?.severity ?? 'secondary';
  }

  displayUpdate(itemDto: SalidaMaterialResponse): void {
    this.router.navigate(['../actualizar/' + itemDto.idOrdenInterna], { relativeTo: this.route });
  }

  displayCreate(): void {
    this.router.navigate(['../crear'], { relativeTo: this.route });
  }

  private buildColumns(estados: FilterOption[]): NativeColumn<SalidaMaterialResponse>[] {
    return [
      { id: 'folio', label: 'Solicitud', field: 'folio', width: 150, filter: { type: 'text' }, align: 'left' },
      { id: 'emisor', label: 'Entregado por', width: 220, filter: { type: 'text' }, align: 'left' },
      { id: 'createdAt', label: 'Entregado el', width: 180, filter: { type: 'date' }, align: 'left' },
      { id: 'receptor', label: 'Entregado a', width: 220, filter: { type: 'text' }, align: 'left' },
      { id: 'estado', label: 'Estado', width: 140, filter: { type: 'select', options: estados }, align: 'left' },
      { id: 'acciones', label: 'Acciones', width: 110, minWidth: 96, sortable: false, tooltip: false, align: 'center' },
    ];
  }
}
