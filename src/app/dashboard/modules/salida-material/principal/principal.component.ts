import { Component, inject, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { tap } from 'rxjs';
import { TagModule } from 'primeng/tag';
import { AppPrimengModule } from '@shared/app-primeng/app-primeng.module';
import { BotonRegresarComponent } from '@shared/components/boton-regresar/boton-regresar.component';
import { HeaderComponent } from '@shared/components/header/header.component';
import { DatetimePipe } from '@shared/pipes/datetime.pipe';
import {
  CatalogTableState,
  FilterOption,
  localPageSource,
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

  columns: NativeColumn<SalidaMaterialResponse>[] = this.buildColumns([
    { value: 'EN_USO', label: 'En uso' },
    { value: 'BORRADOR', label: 'Borrador' },
  ]);

  private readonly source = localPageSource<SalidaMaterialResponse>(
    () => this.salidaMaterialApiService.getAll().pipe(tap((rows) => this.actualizarOpcionesEstado(rows ?? []))),
    this.columns,
    {
      value: (row, key) => {
        switch (key) {
          case 'emisor': return row.empleadoEmisor?.nombre;
          case 'receptor': return row.empleadoReceptor?.nombre;
          case 'estado': return claveEstado(row.estado);
          case 'estadoLabel': return etiquetaEstado(row.estado);
          default: return (row as unknown as Record<string, unknown>)[key];
        }
      },
      searchKeys: ['folio', 'emisor', 'receptor', 'createdAt', 'estadoLabel'],
    },
  );
  readonly page = new CatalogTableState<SalidaMaterialResponse>(this.source.request);

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
      { id: 'folio', label: 'Solicitud', field: 'folio', width: 150, filter: { type: 'text' }, align: 'center' },
      { id: 'emisor', label: 'Entregado por', width: 220, filter: { type: 'text' }, align: 'center' },
      { id: 'createdAt', label: 'Entregado el', width: 180, filter: { type: 'date' }, align: 'center' },
      { id: 'receptor', label: 'Entregado a', width: 220, filter: { type: 'text' }, align: 'center' },
      { id: 'estado', label: 'Estado', width: 140, filter: { type: 'select', options: estados }, align: 'center' },
      { id: 'acciones', label: 'Acciones', width: 110, minWidth: 96, sortable: false, tooltip: false, align: 'center' },
    ];
  }

  /** Agrega al filtro de Estado los estados que vengan en los datos y no estén en la lista base. */
  private actualizarOpcionesEstado(rows: SalidaMaterialResponse[]): void {
    const actuales = this.columns.find((c) => c.id === 'estado')?.filter?.options ?? [];
    const opciones = new Map<string, string>(actuales.map((o) => [String(o.value), o.label]));
    let cambio = false;
    for (const row of rows) {
      const clave = claveEstado(row.estado);
      if (clave && !opciones.has(clave)) {
        opciones.set(clave, etiquetaEstado(clave));
        cambio = true;
      }
    }
    if (!cambio) return;
    this.columns = this.buildColumns([...opciones.entries()].map(([value, label]) => ({ value, label })));
  }
}
