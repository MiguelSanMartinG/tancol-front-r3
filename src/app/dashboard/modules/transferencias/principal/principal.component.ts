import { Component, inject, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { map } from 'rxjs';
import { AppPrimengModule } from '@shared/app-primeng/app-primeng.module';
import { BotonRegresarComponent } from '@shared/components/boton-regresar/boton-regresar.component';
import { HeaderComponent } from '@shared/components/header/header.component';
import { DatetimePipe } from '@shared/pipes/datetime.pipe';
import {
  CatalogTableState,
  NativeColumn,
  NativeTableComponent,
  NATIVE_TABLE_IMPORTS,
} from '@shared/ui/native-table';
import { TransferenciaResponse } from '../service/transferencia.response';
import { TransferenciaService } from '../service/transferencia.service';

/** Fila de la lista: datos planos para mostrar/filtrar + la respuesta original para "Ver". */
export interface TransferenciaRow {
  id: string;
  base: string;
  destino: string;
  entrego: string;
  entregoel: string;
  data: TransferenciaResponse;
}

@Component({
  selector: 'app-principal',
  templateUrl: './principal.component.html',
  imports: [
    BotonRegresarComponent,
    HeaderComponent,
    AppPrimengModule,
    DatetimePipe,
    ...NATIVE_TABLE_IMPORTS,
  ],
  styleUrl: './principal.component.scss',
})
export class PrincipalComponent implements OnInit, OnDestroy {
  readonly transferenciaService = inject(TransferenciaService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  @ViewChild(NativeTableComponent)
  set nativeTable(table: NativeTableComponent | undefined) {
    this.page.table = table;
  }

  readonly columns: NativeColumn<TransferenciaRow>[] = [
    { id: 'index', label: 'Solicitud', width: 100, minWidth: 72, sortable: false, tooltip: false, align: 'left' },
    { id: 'base', label: 'Almacén base', field: 'base', width: 220, filter: { type: 'text' }, align: 'center' },
    { id: 'destino', label: 'Almacén destino', field: 'destino', width: 220, filter: { type: 'text' }, align: 'center' },
    { id: 'entrego', label: 'Entregado por', field: 'entrego', width: 220, filter: { type: 'text' }, align: 'center' },
    { id: 'entregoel', label: 'Entregado el', field: 'entregoel', width: 180, filter: { type: 'date' }, align: 'center' },
    { id: 'acciones', label: 'Acciones', width: 110, minWidth: 96, sortable: false, tooltip: false, align: 'center' },
  ];

  /** Paginación, filtros, búsqueda y orden en el servidor (GET transferencias/page). */
  readonly page = new CatalogTableState<TransferenciaRow>((query) =>
    this.transferenciaService
      .getPage(query)
      .pipe(map((res) => ({ ...res, items: (res.items ?? []).map((row) => this.toRow(row)) }))),
  );

  ngOnInit(): void {
    this.page.resetAndLoad();
  }

  ngOnDestroy(): void {
    this.page.destroy();
  }

  displayUpdate(itemDto: TransferenciaResponse): void {
    this.router.navigate(['../consultar/', itemDto.idTransferencia], { relativeTo: this.route });
  }

  displayCreate(): void {
    this.router.navigate(['../crear'], { relativeTo: this.route });
  }

  private toRow(row: TransferenciaResponse): TransferenciaRow {
    return {
      id: row.idTransferencia,
      base: row.transferencias?.[0]?.nombreAlmacenOrigen ?? '',
      destino: row.transferencias?.[0]?.nombreAlmacenDestino ?? '',
      entrego: row.idEmpleado?.nombre ?? '',
      entregoel: row.fechaTransferencia,
      data: row,
    };
  }
}
