import { CommonModule } from '@angular/common';
import { Component, ViewChild, computed, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AppPrimengModule } from '@shared/app-primeng/app-primeng.module';
import { SelectModel } from '@core/common/select.model';
import { MessageErrorComponent } from '@shared/components/message-error/message-error.component';
import { BotonRegresarComponent } from '@shared/components/boton-regresar/boton-regresar.component';
import { HeaderComponent } from '@shared/components/header/header.component';
import { DatetimePipe } from '@shared/pipes/datetime.pipe';
import { MessageService } from 'primeng/api';
import { firstValueFrom } from 'rxjs';
import ExcelJS from 'exceljs';
import { EliminarComponent } from '../eliminar/eliminar.component';
import { BitacoraMedicionApiService } from '../services/bitacora-medicion.api.service';
import { MedidorApiService } from '../services/medidor.api.service';
import { BitacoraMedicionCreateDto } from '../services/dtos/bitacora-medicion.create.dto';
import { BitacoraMedicionResponseDto } from '../services/dtos/bitacora-medicion.response.dto';
import { MedidorResponseDto } from '../services/dtos/medidor.response.dto';

type MedidorTableRow = MedidorResponseDto & {
  depth: number;
  hasChildren: boolean;
  isExpanded: boolean;
  ultimaMedicionLitros: number;
};

type MedicionAnomaliaRow = {
  idMedidorPadre: string;
  nombrePadre: string;
  fechaUltimaMedicion: string | null;
  medicionPadre: number;
  sumaMedidoresHijos: number;
  diferencia: number;
  totalHijos: number;
};

type ResumenMensualRow = {
  medidor: string;
  unidad: string;
  periodo: string;
  registros: number;
  totalM3: number;
  totalLitros: number;
  primeraLectura: string;
  ultimaLectura: string;
};

type DetalleBitacoraRow = {
  fecha: string;
  medidor: string;
  unidad: string;
  medicionInicial: number;
  medicionFinal: number;
  consumoM3: number;
  consumoLitros: number;
  liquidado: number;
  litrosMinuto: number | null;
  quedadoEnPipa: number;
  diferencia: number;
  usuario: string;
};

type MedidorHierarchyNode = {
  id: string;
  nombre: string;
  alias: string;
  tipoAgua: string;
  ultimaMedicion: number;
  unidad: string;
  children: MedidorHierarchyNode[];
};

type MedidorTreeCanvasNode = {
  id: string;
  nombre: string;
  tipoAgua: string;
  ultimaMedicion: number;
  unidad: string;
  level: number;
  x: number;
  y: number;
};

type MedidorTreeCanvasEdge = {
  fromId: string;
  toId: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
};

type MedidorTreeCanvas = {
  hasData: boolean;
  width: number;
  height: number;
  levelPositions: number[];
  nodes: MedidorTreeCanvasNode[];
  edges: MedidorTreeCanvasEdge[];
};

@Component({
  selector: 'app-medidor-principal',
  standalone: true,
  imports: [
    CommonModule,
    BotonRegresarComponent,
    HeaderComponent,
    AppPrimengModule,
    ReactiveFormsModule,
    MessageErrorComponent,
    DatetimePipe,
    EliminarComponent,
  ],
  templateUrl: './principal.component.html',
})
export class PrincipalComponent implements OnInit {
  medidorApi = inject(MedidorApiService);
  bitacoraApi = inject(BitacoraMedicionApiService);
  fb = inject(FormBuilder);
  messageService = inject(MessageService);
  @ViewChild(EliminarComponent) eliminarComponent!: EliminarComponent;
  expandedRows = signal<Record<string, boolean>>({});
  idMedidorSeleccionado = signal<string>('');
  showCapturaMedicionDialog = false;
  showAnomaliasDialog = false;
  showArbolDialog = false;
  capturaFechaHoy = new Date();
  equivalenciaMedicionActual = signal<string>('Captura en m3 para ver su equivalente en litros.');

  formularioMedicion = this.fb.group({
    idMedidor: ['', [Validators.required]],
    medicionActual: [0, [Validators.required, Validators.min(0)]],
    liquidado: [0, [Validators.min(0)]],
    quedadoEnPipa: [0, [Validators.min(0)]],
    litrosMinuto: [null as number | null, [Validators.pattern(/^-?\d+(\.\d{1,2})?$/)]],
    comentario: [''],
  });

  constructor(private router: Router, private route: ActivatedRoute) {}

  listaRegistros = computed<MedidorTableRow[]>(() =>
    this.buildDisplayRows(this.medidorApi.listAll(), this.expandedRows())
  );
  listaMedidoresSeleccion = computed<SelectModel[]>(() =>
    this.buildSelectOptions(this.medidorApi.listAll())
  );
  medidorSeleccionado = computed<MedidorResponseDto | null>(() => {
    const idSeleccionado = this.idMedidorSeleccionado();
    if (!idSeleccionado) {
      return null;
    }

    return this.medidorApi.listAll().find((item) => item.idMedidor === idSeleccionado) ?? null;
  });
  lecturaInicialSugerida = computed<number>(() => this.medidorSeleccionado()?.ultimaMedicion ?? 0);
  unidadMedicionSeleccionada = computed<string>(() =>
    this.medidorSeleccionado()?.unidadMedida?.nombre ?? '-'
  );
  reporteAnomalias = computed<MedicionAnomaliaRow[]>(() =>
    this.buildAnomaliasReport(this.medidorApi.listAll())
  );
  arbolMedidores = computed<MedidorHierarchyNode[]>(() =>
    this.buildHierarchyTree(this.medidorApi.listAll())
  );
  arbolCanvas = computed<MedidorTreeCanvas>(() => this.buildTreeCanvas(this.arbolMedidores()));

  ngOnInit(): void {
    this.formularioMedicion.get('idMedidor')?.valueChanges.subscribe((idMedidor) => {
      this.idMedidorSeleccionado.set(idMedidor ?? '');
    });
    this.formularioMedicion.get('medicionActual')?.valueChanges.subscribe((value) => {
      this.equivalenciaMedicionActual.set(this.buildMedicionActualHint(value));
    });
    this.equivalenciaMedicionActual.set(
      this.buildMedicionActualHint(this.formularioMedicion.get('medicionActual')?.value)
    );
    this.cargarMedidores();
  }

  displayUpdate(itemDto: MedidorResponseDto) {
    this.router.navigate(['../actualizar', itemDto.idMedidor], { relativeTo: this.route });
  }
  displayDelete(itemDto: MedidorResponseDto) {
    this.eliminarComponent.itemDto.set({ ...itemDto });
    this.eliminarComponent.display = true;
  }
  displayBitacora(itemDto: MedidorResponseDto) {
    this.router.navigate(['../bitacora', itemDto.idMedidor], { relativeTo: this.route });
  }
  displayHijos(itemDto: MedidorResponseDto) {
    this.router.navigate(['../hijos', itemDto.idMedidor], { relativeTo: this.route });
  }
  displayCreate() {
    this.router.navigate(['../crear'], { relativeTo: this.route });
  }
  displayArbol() {
    this.router.navigate(['../arbol'], { relativeTo: this.route });
  }
  openCapturaMedicionDialog() {
    this.idMedidorSeleccionado.set(this.formularioMedicion.get('idMedidor')?.value ?? '');
    this.showCapturaMedicionDialog = true;
  }
  closeCapturaMedicionDialog() {
    this.showCapturaMedicionDialog = false;
    this.idMedidorSeleccionado.set('');
  }
  openAnomaliasDialog() {
    this.showAnomaliasDialog = true;
  }
  closeAnomaliasDialog() {
    this.showAnomaliasDialog = false;
  }
  async exportAnomaliasExcel() {
    const [bitacoras, workbook] = await Promise.all([
      firstValueFrom(this.bitacoraApi.getAllFilter()),
      Promise.resolve(new ExcelJS.Workbook()),
    ]);

    workbook.addWorksheet('Anomalias');
    workbook.addWorksheet('Resumen mensual');
    workbook.addWorksheet('Detalle registros');

    const sheetAnomalias = workbook.getWorksheet('Anomalias')!;
    sheetAnomalias.columns = [
      { header: 'Medidor padre', key: 'nombrePadre', width: 28 },
      { header: 'Fecha ultima medicion', key: 'fechaUltimaMedicion', width: 18 },
      { header: '# Hijos', key: 'totalHijos', width: 10 },
      { header: 'Medicion padre (m3)', key: 'medicionPadre', width: 18 },
      { header: 'Suma hijos (m3)', key: 'sumaMedidoresHijos', width: 18 },
      { header: 'Diferencia (m3)', key: 'diferencia', width: 18 },
    ];
    sheetAnomalias.addRows(
      this.reporteAnomalias().map((row) => ({
        nombrePadre: row.nombrePadre,
        fechaUltimaMedicion: this.formatDate(row.fechaUltimaMedicion),
        totalHijos: row.totalHijos,
        medicionPadre: row.medicionPadre,
        sumaMedidoresHijos: row.sumaMedidoresHijos,
        diferencia: row.diferencia,
      }))
    );

    const sheetResumen = workbook.getWorksheet('Resumen mensual')!;
    sheetResumen.columns = [
      { header: 'Medidor', key: 'medidor', width: 28 },
      { header: 'Unidad', key: 'unidad', width: 14 },
      { header: 'Periodo', key: 'periodo', width: 20 },
      { header: 'Registros', key: 'registros', width: 12 },
      { header: 'Total m3', key: 'totalM3', width: 14 },
      { header: 'Total litros', key: 'totalLitros', width: 16 },
      { header: 'Primera lectura', key: 'primeraLectura', width: 18 },
      { header: 'Ultima lectura', key: 'ultimaLectura', width: 18 },
    ];
    sheetResumen.addRows(this.buildResumenMensual(bitacoras));

    const sheetDetalle = workbook.getWorksheet('Detalle registros')!;
    sheetDetalle.columns = [
      { header: 'Fecha', key: 'fecha', width: 18 },
      { header: 'Medidor', key: 'medidor', width: 28 },
      { header: 'Unidad', key: 'unidad', width: 14 },
      { header: 'Medicion inicial (m3)', key: 'medicionInicial', width: 18 },
      { header: 'Medicion final (m3)', key: 'medicionFinal', width: 18 },
      { header: 'Consumo (m3)', key: 'consumoM3', width: 16 },
      { header: 'Consumo (LTS)', key: 'consumoLitros', width: 16 },
      { header: 'Liquidado', key: 'liquidado', width: 12 },
      { header: 'Quedado en pipa', key: 'quedadoEnPipa', width: 16 },
      { header: 'Litros por minuto', key: 'litrosMinuto', width: 18 },
      { header: 'Diferencia', key: 'diferencia', width: 12 },
      { header: 'Usuario', key: 'usuario', width: 20 },
    ];
    sheetDetalle.addRows(this.buildDetalleBitacora(bitacoras));

    [sheetAnomalias, sheetResumen, sheetDetalle].forEach((sheet) => {
      sheet.getRow(1).eachCell((cell) => {
        cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FF0F4C81' },
        };
      });
      sheet.views = [{ state: 'frozen', ySplit: 1 }];
    });

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    const enlace = document.createElement('a');
    enlace.href = URL.createObjectURL(blob);
    enlace.download = `reporte-anomalias-medidores-${new Date().toISOString().slice(0, 10)}.xlsx`;
    enlace.click();
    URL.revokeObjectURL(enlace.href);
  }
  openArbolDialog() {
    this.showArbolDialog = true;
  }
  closeArbolDialog() {
    this.showArbolDialog = false;
  }
  registrarMedicion() {
    if (!this.formularioMedicion.valid) {
      this.formularioMedicion.markAllAsTouched();
      this.messageService.add({
        key: 'center',
        severity: 'warn',
        summary: '¡Precaución!',
        detail: 'Hay campos inválidos o faltan campos por llenar.'
      });
      return;
    }

    const form = this.formularioMedicion.getRawValue();
    const request: BitacoraMedicionCreateDto = {
      idMedidor: form.idMedidor ?? '',
      medicionActual: parseFloat(form.medicionActual as any),
      liquidado: Number(form.liquidado ?? 0),
      quedadoEnPipa: Number(form.quedadoEnPipa ?? 0),
      litrosMinuto: form.litrosMinuto == null ? undefined : Number(form.litrosMinuto),
      comentario: form.comentario ?? '',
    };

    this.bitacoraApi.create(request).subscribe(() => {
      this.messageService.add({
        key: 'top-right',
        severity: 'success',
        summary: '¡Registro exitoso!',
        detail: 'Se ha registrado la medición'
      });
      this.showCapturaMedicionDialog = false;
      this.formularioMedicion.reset({
        idMedidor: '',
        medicionActual: 0,
        liquidado: 0,
        quedadoEnPipa: 0,
        litrosMinuto: null,
        comentario: '',
      });
      this.idMedidorSeleccionado.set('');
      this.cargarMedidores();
    });
  }
  searchTable(tableComponent: any, event: Event) {
    const target = event.target as HTMLInputElement | null;
    tableComponent.filterGlobal(target?.value ?? '', 'contains');
  }

  medicionActualHint(): string {
    return this.equivalenciaMedicionActual();
  }

  private buildMedicionActualHint(rawValue: unknown): string {
    if (rawValue === null || rawValue === undefined) {
      return 'Captura en m3 para ver su equivalente en litros.';
    }

    if (typeof rawValue === 'string' && rawValue.trim() === '') {
      return 'Captura en m3 para ver su equivalente en litros.';
    }

    const normalizedValue = String(rawValue).replace(',', '.').trim();
    const medicionActual = Number(normalizedValue);
    if (!Number.isFinite(medicionActual) || medicionActual < 0) {
      return 'Captura en m3 para ver su equivalente en litros.';
    }

    const litros = medicionActual * 1000;
    const medicionFormateada = new Intl.NumberFormat('es-MX', { maximumFractionDigits: 3 }).format(medicionActual);
    const litrosFormateados = new Intl.NumberFormat('es-MX', { maximumFractionDigits: 2 }).format(litros);
    return `Capturaste ${medicionFormateada} m3, equivale a ${litrosFormateados} LTS.`;
  }

  toggleExpand(item: MedidorTableRow, event?: Event) {
    event?.stopPropagation();

    if (!item.hasChildren) {
      return;
    }

    this.expandedRows.update((current) => ({
      ...current,
      [item.idMedidor]: !current[item.idMedidor],
    }));
  }

  private buildDisplayRows(
    medidores: MedidorResponseDto[],
    expandedById: Record<string, boolean>
  ): MedidorTableRow[] {
    if (medidores.length === 0) {
      return [];
    }

    const { nodesById, childrenByParent, rootIds } = this.buildGraph(medidores);
    const rows: MedidorTableRow[] = [];

    for (const rootId of rootIds) {
      this.appendRows(rootId, 0, nodesById, childrenByParent, expandedById, rows, new Set<string>());
    }

    return rows;
  }

  private buildSelectOptions(medidores: MedidorResponseDto[]): SelectModel[] {
    if (medidores.length === 0) {
      return [];
    }

    const { nodesById, childrenByParent, rootIds } = this.buildGraph(medidores);
    const options: SelectModel[] = [];

    for (const rootId of rootIds) {
      this.appendSelectOption(rootId, 0, nodesById, childrenByParent, options, new Set<string>());
    }

    return options;
  }

  private buildAnomaliasReport(medidores: MedidorResponseDto[]): MedicionAnomaliaRow[] {
    if (medidores.length === 0) {
      return [];
    }

    const { nodesById, childrenByParent } = this.buildGraph(medidores);
    const anomalies: MedicionAnomaliaRow[] = [];

    for (const [idPadre, childIdsSet] of childrenByParent.entries()) {
      const padre = nodesById.get(idPadre);
      if (!padre) {
        continue;
      }

      const childIds = [...childIdsSet].filter((childId) => nodesById.has(childId));
      if (childIds.length === 0) {
        continue;
      }

      const sumaMedidoresHijos = childIds.reduce((acc, childId) => {
        const hijo = nodesById.get(childId);
        return acc + (hijo?.ultimaMedicion ?? 0);
      }, 0);

      const medicionPadre = padre.ultimaMedicion ?? 0;
      const diferencia = medicionPadre - sumaMedidoresHijos;
      const precisionTolerance = 0.000001;

      if (Math.abs(diferencia) <= precisionTolerance) {
        continue;
      }

      anomalies.push({
        idMedidorPadre: padre.idMedidor,
        nombrePadre: padre.nombre,
        fechaUltimaMedicion: padre.fechaUltimaMedicion,
        medicionPadre,
        sumaMedidoresHijos,
        diferencia,
        totalHijos: childIds.length,
      });
    }

    return anomalies.sort((a, b) => Math.abs(b.diferencia) - Math.abs(a.diferencia));
  }

  private buildResumenMensual(bitacoras: BitacoraMedicionResponseDto[]): ResumenMensualRow[] {
    const grouped = new Map<
      string,
      {
        medidor: string;
        unidad: string;
        periodo: string;
        registros: number;
        totalM3: number;
        totalLitros: number;
        primeraLecturaTs: number;
        ultimaLecturaTs: number;
      }
    >();

    for (const registro of bitacoras) {
      const fecha = new Date(registro.cratedAt);
      if (Number.isNaN(fecha.getTime())) {
        continue;
      }

      const key = `${registro.medidor.idMedidor}-${fecha.getFullYear()}-${fecha.getMonth()}`;
      const periodo = this.formatMonthYear(fecha);
      const consumoM3 = registro.consumo ?? registro.medicionFinal - registro.medicionInicial;
      const consumoLitros = consumoM3 * 1000;
      const current = grouped.get(key) ?? {
        medidor: registro.medidor.nombre,
        unidad: registro.medidor.unidadMedida?.nombre ?? '-',
        periodo,
        registros: 0,
        totalM3: 0,
        totalLitros: 0,
        primeraLecturaTs: fecha.getTime(),
        ultimaLecturaTs: fecha.getTime(),
      };

      current.registros += 1;
      current.totalM3 += consumoM3;
      current.totalLitros += consumoLitros;
      if (fecha.getTime() < current.primeraLecturaTs) {
        current.primeraLecturaTs = fecha.getTime();
      }
      if (fecha.getTime() > current.ultimaLecturaTs) {
        current.ultimaLecturaTs = fecha.getTime();
      }
      grouped.set(key, current);
    }

    return [...grouped.values()]
      .sort((a, b) => a.medidor.localeCompare(b.medidor) || a.periodo.localeCompare(b.periodo))
      .map((row) => ({
        medidor: row.medidor,
        unidad: row.unidad,
        periodo: row.periodo,
        registros: row.registros,
        totalM3: Number(row.totalM3.toFixed(3)),
        totalLitros: Number(row.totalLitros.toFixed(2)),
        primeraLectura: this.formatDate(new Date(row.primeraLecturaTs).toISOString()),
        ultimaLectura: this.formatDate(new Date(row.ultimaLecturaTs).toISOString()),
      }));
  }

  private buildDetalleBitacora(bitacoras: BitacoraMedicionResponseDto[]): DetalleBitacoraRow[] {
    return [...bitacoras]
      .sort((a, b) => new Date(b.cratedAt).getTime() - new Date(a.cratedAt).getTime())
      .map((registro) => {
        const consumoM3 = registro.consumo ?? registro.medicionFinal - registro.medicionInicial;
        return {
          fecha: this.formatDate(registro.cratedAt),
          medidor: registro.medidor.nombre,
          unidad: registro.medidor.unidadMedida?.nombre ?? '-',
          medicionInicial: Number(registro.medicionInicial ?? 0),
          medicionFinal: Number(registro.medicionFinal ?? 0),
          consumoM3: Number(consumoM3.toFixed(3)),
          consumoLitros: Number((consumoM3 * 1000).toFixed(2)),
          liquidado: Number(registro.liquidado ?? 0),
          quedadoEnPipa: Number(registro.quedadoEnPipa ?? 0),
          litrosMinuto: registro.litrosMinuto ?? null,
          diferencia: Number(registro.diferencia ?? 0),
          usuario: registro.usuario ?? '-',
        };
      });
  }

  private formatDate(value: string | null | undefined): string {
    if (!value) {
      return '-';
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return '-';
    }

    return new Intl.DateTimeFormat('es-MX', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(date);
  }

  private formatMonthYear(value: Date): string {
    return new Intl.DateTimeFormat('es-MX', {
      month: 'long',
      year: 'numeric',
    }).format(value);
  }

  private buildHierarchyTree(medidores: MedidorResponseDto[]): MedidorHierarchyNode[] {
    if (medidores.length === 0) {
      return [];
    }

    const { nodesById, childrenByParent, rootIds } = this.buildGraph(medidores);

    return rootIds
      .filter((id) => nodesById.has(id))
      .map((id) => this.createHierarchyNode(id, nodesById, childrenByParent, new Set<string>()));
  }

  private createHierarchyNode(
    id: string,
    nodesById: Map<string, MedidorResponseDto>,
    childrenByParent: Map<string, Set<string>>,
    ancestors: Set<string>
  ): MedidorHierarchyNode {
    const medidor = nodesById.get(id)!;
    const nextAncestors = new Set(ancestors);
    nextAncestors.add(id);

    const children = [...(childrenByParent.get(id) ?? [])]
      .filter((childId) => nodesById.has(childId) && !nextAncestors.has(childId))
      .map((childId) => this.createHierarchyNode(childId, nodesById, childrenByParent, nextAncestors));

    return {
      id: medidor.idMedidor,
      nombre: medidor.nombre,
      alias: medidor.alias,
      tipoAgua: medidor.tipoAgua,
      ultimaMedicion: medidor.ultimaMedicion ?? 0,
      unidad: medidor.unidadMedida?.nombre ?? '-',
      children,
    };
  }

  private buildTreeCanvas(roots: MedidorHierarchyNode[]): MedidorTreeCanvas {
    if (roots.length === 0) {
      return {
        hasData: false,
        width: 0,
        height: 0,
        levelPositions: [],
        nodes: [],
        edges: [],
      };
    }

    const leftPadding = 120;
    const rightPadding = 40;
    const topPadding = 44;
    const levelSpacing = 120;
    const nodeDiameter = 42;
    const minColumnSpacing = 120;
    const minWidth = 760;

    const entries: Array<{
      id: string;
      nombre: string;
      tipoAgua: string;
      ultimaMedicion: number;
      unidad: string;
      level: number;
      parentId: string | null;
      order: number;
    }> = [];
    let order = 0;

    const visit = (
      node: MedidorHierarchyNode,
      level: number,
      parentId: string | null,
      ancestors: Set<string>
    ) => {
      if (ancestors.has(node.id)) {
        return;
      }

      entries.push({
        id: node.id,
        nombre: node.nombre,
        tipoAgua: node.tipoAgua,
        ultimaMedicion: node.ultimaMedicion,
        unidad: node.unidad,
        level,
        parentId,
        order: order++,
      });

      const nextAncestors = new Set(ancestors);
      nextAncestors.add(node.id);

      for (const child of node.children) {
        visit(child, level + 1, node.id, nextAncestors);
      }
    };

    for (const root of roots) {
      visit(root, 0, null, new Set<string>());
    }

    const byLevel = new Map<number, typeof entries>();
    let maxLevel = 0;

    for (const entry of entries) {
      const current = byLevel.get(entry.level) ?? [];
      current.push(entry);
      byLevel.set(entry.level, current);
      maxLevel = Math.max(maxLevel, entry.level);
    }

    let maxNodesInLevel = 0;
    for (const levelEntries of byLevel.values()) {
      maxNodesInLevel = Math.max(maxNodesInLevel, levelEntries.length);
    }

    const drawAreaWidth = Math.max(
      minWidth,
      leftPadding +
        rightPadding +
        Math.max(1, maxNodesInLevel - 1) * minColumnSpacing +
        nodeDiameter
    );
    const height = Math.max(260, topPadding * 2 + maxLevel * levelSpacing + nodeDiameter + 20);

    const levelPositions: number[] = [];
    const nodePositionById = new Map<string, { x: number; y: number }>();
    const nodes: MedidorTreeCanvasNode[] = [];

    for (let level = 0; level <= maxLevel; level++) {
      const levelEntries = [...(byLevel.get(level) ?? [])].sort((a, b) => a.order - b.order);
      const y = topPadding + level * levelSpacing;
      levelPositions.push(y);

      if (levelEntries.length === 0) {
        continue;
      }

      if (levelEntries.length === 1) {
        const onlyNode = levelEntries[0];
        const centerX = leftPadding + (drawAreaWidth - leftPadding - rightPadding) / 2;
        nodePositionById.set(onlyNode.id, { x: centerX, y });
        nodes.push({
          id: onlyNode.id,
          nombre: onlyNode.nombre,
          tipoAgua: onlyNode.tipoAgua,
          ultimaMedicion: onlyNode.ultimaMedicion,
          unidad: onlyNode.unidad,
          level,
          x: centerX,
          y,
        });
        continue;
      }

      const usableWidth = drawAreaWidth - leftPadding - rightPadding;
      const gap = usableWidth / (levelEntries.length - 1);

      levelEntries.forEach((entry, index) => {
        const x = leftPadding + gap * index;
        nodePositionById.set(entry.id, { x, y });
        nodes.push({
          id: entry.id,
          nombre: entry.nombre,
          tipoAgua: entry.tipoAgua,
          ultimaMedicion: entry.ultimaMedicion,
          unidad: entry.unidad,
          level,
          x,
          y,
        });
      });
    }

    const nodeRadius = nodeDiameter / 2;
    const edges: MedidorTreeCanvasEdge[] = entries
      .filter((entry) => !!entry.parentId)
      .map((entry) => {
        const from = nodePositionById.get(entry.parentId!);
        const to = nodePositionById.get(entry.id);

        if (!from || !to) {
          return null;
        }

        return {
          fromId: entry.parentId!,
          toId: entry.id,
          x1: from.x,
          y1: from.y + nodeRadius,
          x2: to.x,
          y2: to.y - nodeRadius,
        };
      })
      .filter((item): item is MedidorTreeCanvasEdge => !!item);

    return {
      hasData: true,
      width: drawAreaWidth,
      height,
      levelPositions,
      nodes,
      edges,
    };
  }

  private appendSelectOption(
    idMedidor: string,
    depth: number,
    nodesById: Map<string, MedidorResponseDto>,
    childrenByParent: Map<string, Set<string>>,
    options: SelectModel[],
    ancestors: Set<string>
  ) {
    if (ancestors.has(idMedidor)) {
      return;
    }

    const medidor = nodesById.get(idMedidor);
    if (!medidor) {
      return;
    }

    const prefix = depth > 0 ? `${'— '.repeat(depth)}` : '';
    options.push({
      label: `${prefix}${medidor.nombre}${medidor.alias ? ` (${medidor.alias})` : ''}`,
      value: medidor.idMedidor,
      data: medidor,
    });

    const nextAncestors = new Set(ancestors);
    nextAncestors.add(idMedidor);

    for (const childId of childrenByParent.get(idMedidor) ?? []) {
      this.appendSelectOption(
        childId,
        depth + 1,
        nodesById,
        childrenByParent,
        options,
        nextAncestors
      );
    }
  }

  private cargarMedidores() {
    this.medidorApi.getAll().subscribe();
  }

  private buildGraph(medidores: MedidorResponseDto[]) {
    const nodesById = new Map<string, MedidorResponseDto>();
    const childrenByParent = new Map<string, Set<string>>();
    const childIds = new Set<string>();
    const topLevelOrder: string[] = [];
    const topLevelSeen = new Set<string>();

    for (const medidor of medidores) {
      if (!topLevelSeen.has(medidor.idMedidor)) {
        topLevelSeen.add(medidor.idMedidor);
        topLevelOrder.push(medidor.idMedidor);
      }
      this.collectMedidor(medidor, null, nodesById, childrenByParent, childIds);
    }

    const rootIds = topLevelOrder.filter((id) => !childIds.has(id) && nodesById.has(id));

    return {
      nodesById,
      childrenByParent,
      rootIds: rootIds.length > 0 ? rootIds : topLevelOrder,
    };
  }

  private collectMedidor(
    medidor: MedidorResponseDto,
    parentId: string | null,
    nodesById: Map<string, MedidorResponseDto>,
    childrenByParent: Map<string, Set<string>>,
    childIds: Set<string>
  ) {
    const existing = nodesById.get(medidor.idMedidor);
    nodesById.set(medidor.idMedidor, this.mergeMedidor(existing, medidor));

    if (parentId) {
      const children = childrenByParent.get(parentId) ?? new Set<string>();
      children.add(medidor.idMedidor);
      childrenByParent.set(parentId, children);
      childIds.add(medidor.idMedidor);
    }

    for (const child of medidor.medidoresHijos ?? []) {
      this.collectMedidor(child, medidor.idMedidor, nodesById, childrenByParent, childIds);
    }
  }

  private mergeMedidor(
    existing: MedidorResponseDto | undefined,
    incoming: MedidorResponseDto
  ): MedidorResponseDto {
    if (!existing) {
      return incoming;
    }

    const existingChildren = existing.medidoresHijos ?? [];
    const incomingChildren = incoming.medidoresHijos ?? [];
    const childrenById = new Map<string, MedidorResponseDto>();

    for (const child of existingChildren) {
      childrenById.set(child.idMedidor, child);
    }

    for (const child of incomingChildren) {
      const current = childrenById.get(child.idMedidor);
      childrenById.set(child.idMedidor, current ? this.mergeMedidor(current, child) : child);
    }

    const mergedChildren = [...childrenById.values()];

    return {
      ...existing,
      ...incoming,
      medidoresHijos: mergedChildren.length > 0 ? mergedChildren : undefined,
    };
  }

  private toLitros(valorM3: number): number {
    return valorM3 * 1000;
  }

  private appendRows(
    idMedidor: string,
    depth: number,
    nodesById: Map<string, MedidorResponseDto>,
    childrenByParent: Map<string, Set<string>>,
    expandedById: Record<string, boolean>,
    rows: MedidorTableRow[],
    ancestors: Set<string>
  ) {
    if (ancestors.has(idMedidor)) {
      return;
    }

    const medidor = nodesById.get(idMedidor);
    if (!medidor) {
      return;
    }

    const childIds = [...(childrenByParent.get(idMedidor) ?? [])].filter((childId) =>
      nodesById.has(childId)
    );
    const hasChildren = childIds.length > 0;
    const isExpanded = hasChildren && !!expandedById[idMedidor];

    rows.push({
      ...medidor,
      depth,
      hasChildren,
      isExpanded,
      ultimaMedicionLitros: this.toLitros(medidor.ultimaMedicion ?? 0),
    });

    if (!isExpanded) {
      return;
    }

    const nextAncestors = new Set(ancestors);
    nextAncestors.add(idMedidor);

    for (const childId of childIds) {
      this.appendRows(
        childId,
        depth + 1,
        nodesById,
        childrenByParent,
        expandedById,
        rows,
        nextAncestors
      );
    }
  }
}
