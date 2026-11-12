import { LeyendaM3Pipe, LitrosAM3Pipe } from '../utils/equivalencia-m3.pipe';
import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, DestroyRef, ElementRef, OnInit, ViewChild, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AppPrimengModule } from '@shared/app-primeng/app-primeng.module';
import { BotonRegresarComponent } from '@shared/components/boton-regresar/boton-regresar.component';
import { HeaderComponent } from '@shared/components/header/header.component';
import { MessageService } from 'primeng/api';
import { BitacoraMedicionApiService } from '../services/bitacora-medicion.api.service';
import { MedidorApiService } from '../services/medidor.api.service';
import { BitacoraMedicionCreateDto } from '../services/dtos/bitacora-medicion.create.dto';
import { MedidorResponseDto } from '../services/dtos/medidor.response.dto';

type MedidorHierarchyNode = {
  id: string;
  nombre: string;
  tipoAgua: string;
  ultimaMedicion: number;
  medidoHoy: boolean;
  children: MedidorHierarchyNode[];
};

type MedidorTreeCanvasNode = {
  id: string;
  nombre: string;
  ultimaMedicion: number;
  ultimaMedicionLitros: number;
  medidoHoy: boolean;
  x: number;
  y: number;
};

type MedidorTreeCanvasEdge = {
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
  selector: 'app-medidor-arbol',
  standalone: true,
  imports: [
    CommonModule,
    LeyendaM3Pipe,
    LitrosAM3Pipe,
    AppPrimengModule,
    BotonRegresarComponent,
    HeaderComponent,
    ReactiveFormsModule,
  ],
  templateUrl: './arbol.component.html',
})
export class ArbolComponent implements OnInit {
  private medidorApi = inject(MedidorApiService);
  private bitacoraApi = inject(BitacoraMedicionApiService);
  private fb = inject(FormBuilder);
  private messageService = inject(MessageService);
  private destroyRef = inject(DestroyRef);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  @ViewChild('diagramViewport') diagramViewport?: ElementRef<HTMLDivElement>;

  showCapturaMedicionDialog = false;
  capturaFechaHoy = new Date();
  idMedidorSeleccionado = signal<string>('');
  searchTerm = signal<string>('');
  zoomLevel = signal<number>(1);
  viewportWidth = signal<number>(0);
  viewportHeight = signal<number>(0);
  panX = signal<number>(0);
  panY = signal<number>(0);
  isPanning = signal<boolean>(false);

  private panStartX = 0;
  private panStartY = 0;
  private panOriginX = 0;
  private panOriginY = 0;
  private hasDragged = false;
  private ignoreNextNodeClick = false;

  formularioMedicion = this.fb.group({
    idMedidor: [{ value: '', disabled: true }, [Validators.required]],
    medicionActual: [0, [Validators.required, Validators.min(0)]],
    liquidado: [0, [Validators.min(0)]],
    quedadoEnPipa: [0, [Validators.min(0)]],
    litrosMinuto: [null as number | null, [Validators.pattern(/^-?\d+(\.\d{1,2})?$/)]],
    comentario: [''],
  });

  arbolMedidores = computed<MedidorHierarchyNode[]>(() =>
    this.buildHierarchyTree(this.medidorApi.listAll())
  );
  arbolCanvas = computed<MedidorTreeCanvas>(() => this.buildTreeCanvas(this.arbolMedidores()));
  fitScale = computed<number>(() => {
    const width = this.arbolCanvas().width;
    const viewport = this.viewportWidth();
    const height = this.arbolCanvas().height;
    const viewportHeight = this.viewportHeight();

    if (!width || !viewport || !height || !viewportHeight) {
      return 1;
    }

    const availableWidth = Math.max(0, viewport - 20);
    const availableHeight = Math.max(0, viewportHeight - 20);
    const scaleByWidth = availableWidth / width;
    const scaleByHeight = availableHeight / height;

    return Math.min(1, scaleByWidth, scaleByHeight);
  });
  effectiveScale = computed<number>(() => this.fitScale() * this.zoomLevel());
  totalNodos = computed<number>(() => this.arbolCanvas().nodes.length);
  nodosMedidosHoy = computed<number>(() => this.arbolCanvas().nodes.filter((node) => node.medidoHoy).length);
  nodosPendientes = computed<number>(() => this.totalNodos() - this.nodosMedidosHoy());
  medidorSeleccionado = computed<MedidorResponseDto | null>(() => {
    const id = this.idMedidorSeleccionado();
    if (!id) {
      return null;
    }

    const { nodesById } = this.buildGraph(this.medidorApi.listAll());
    return nodesById.get(id) ?? null;
  });
  medidorSeleccionadoLabel = computed<string>(() => {
    const medidor = this.medidorSeleccionado();
    if (!medidor) {
      return '';
    }
    return medidor.alias ? `${medidor.nombre} (${medidor.alias})` : medidor.nombre;
  });
  lecturaInicialSugerida = computed<number>(() =>
    this.toLitros(this.medidorSeleccionado()?.ultimaMedicion ?? 0)
  );
  unidadMedicionSeleccionada = computed<string>(() => 'LTS');

  ngOnInit(): void {
    this.medidorApi.getAll().subscribe();
  }

  ngAfterViewInit(): void {
    const element = this.diagramViewport?.nativeElement;
    if (!element || typeof ResizeObserver === 'undefined') {
      return;
    }

    const resizeObserver = new ResizeObserver((entries) => {
      const width = entries[0]?.contentRect.width ?? 0;
      const height = entries[0]?.contentRect.height ?? 0;
      this.viewportWidth.set(width);
      this.viewportHeight.set(height);
    });

    resizeObserver.observe(element);
    this.destroyRef.onDestroy(() => resizeObserver.disconnect());
  }

  regresar() {
    this.router.navigate(['../principal'], { relativeTo: this.route });
  }

  onSearchInput(event: Event) {
    const target = event.target as HTMLInputElement | null;
    this.searchTerm.set((target?.value ?? '').trim().toLowerCase());
  }

  clearSearch() {
    this.searchTerm.set('');
  }

  zoomIn() {
    this.zoomLevel.update((value) => Math.min(1.4, +(value + 0.1).toFixed(2)));
  }

  zoomOut() {
    this.zoomLevel.update((value) => Math.max(0.4, +(value - 0.1).toFixed(2)));
  }

  resetZoom() {
    this.zoomLevel.set(1);
  }

  resetView() {
    this.zoomLevel.set(1);
    this.panX.set(0);
    this.panY.set(0);
  }

  startPan(event: MouseEvent) {
    this.isPanning.set(true);
    this.hasDragged = false;
    this.panStartX = event.clientX;
    this.panStartY = event.clientY;
    this.panOriginX = this.panX();
    this.panOriginY = this.panY();
  }

  movePan(event: MouseEvent) {
    if (!this.isPanning()) {
      return;
    }

    const deltaX = event.clientX - this.panStartX;
    const deltaY = event.clientY - this.panStartY;

    if (Math.abs(deltaX) > 2 || Math.abs(deltaY) > 2) {
      this.hasDragged = true;
    }

    this.panX.set(this.panOriginX + deltaX);
    this.panY.set(this.panOriginY + deltaY);
  }

  endPan() {
    if (this.isPanning() && this.hasDragged) {
      this.ignoreNextNodeClick = true;
    }

    this.isPanning.set(false);
  }

  onNodeClick(idMedidor: string) {
    if (this.ignoreNextNodeClick) {
      this.ignoreNextNodeClick = false;
      return;
    }

    this.openCapturaMedicionDialog(idMedidor);
  }

  nodeMatchesSearch(node: MedidorTreeCanvasNode): boolean {
    const term = this.searchTerm();
    if (!term) {
      return false;
    }

    return (
      node.nombre.toLowerCase().includes(term) ||
      node.id.toLowerCase().includes(term) ||
      `${node.ultimaMedicion}`.includes(term) ||
      `${node.ultimaMedicionLitros}`.includes(term)
    );
  }

  openCapturaMedicionDialog(idMedidor: string) {
    this.idMedidorSeleccionado.set(idMedidor);
    this.formularioMedicion.reset({
      idMedidor,
      medicionActual: 0,
      liquidado: 0,
      quedadoEnPipa: 0,
      litrosMinuto: null,
      comentario: '',
    });
    this.showCapturaMedicionDialog = true;
  }

  closeCapturaMedicionDialog() {
    this.showCapturaMedicionDialog = false;
    this.idMedidorSeleccionado.set('');
  }

  registrarMedicion() {
    if (!this.idMedidorSeleccionado()) {
      this.messageService.add({
        key: 'center',
        severity: 'warn',
        summary: '¡Precaución!',
        detail: 'No se encontró el medidor seleccionado.'
      });
      return;
    }

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
      idMedidor: this.idMedidorSeleccionado(),
      medicionActual: Number(form.medicionActual ?? 0) / 1000,
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
      this.idMedidorSeleccionado.set('');
      this.formularioMedicion.reset({
        idMedidor: '',
        medicionActual: 0,
        liquidado: 0,
        quedadoEnPipa: 0,
        litrosMinuto: null,
        comentario: '',
      });
      this.medidorApi.getAll().subscribe();
    });
  }

  private toLitros(valorM3: number): number {
    return Number(valorM3 || 0) * 1000;
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
      tipoAgua: medidor.tipoAgua,
      ultimaMedicion: medidor.ultimaMedicion ?? 0,
      medidoHoy: this.isFechaHoy(medidor.fechaUltimaMedicion),
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

    const leftPadding = 170;
    const rightPadding = 36;
    const topPadding = 34;
    const levelSpacing = 150;
    const levelLabelOffsetY = 12;
    const nodeCenterOffsetY = 44;
    const nodeDiameter = 38;
    const minColumnSpacing = 150;
    const minWidth = 860;

    const entries: Array<{
      id: string;
      nombre: string;
      ultimaMedicion: number;
      ultimaMedicionLitros: number;
      medidoHoy: boolean;
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
        ultimaMedicion: node.ultimaMedicion,
        ultimaMedicionLitros: this.toLitros(node.ultimaMedicion),
        medidoHoy: node.medidoHoy,
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
    const height = Math.max(
      330,
      topPadding +
        maxLevel * levelSpacing +
        nodeCenterOffsetY +
        nodeDiameter +
        36
    );

    const levelPositions: number[] = [];
    const nodePositionById = new Map<string, { x: number; y: number }>();
    const nodes: MedidorTreeCanvasNode[] = [];

    for (let level = 0; level <= maxLevel; level++) {
      const levelEntries = [...(byLevel.get(level) ?? [])].sort((a, b) => a.order - b.order);
      const rowStartY = topPadding + level * levelSpacing;
      const y = rowStartY + nodeCenterOffsetY;
      levelPositions.push(rowStartY + levelLabelOffsetY);

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
          ultimaMedicion: onlyNode.ultimaMedicion,
          ultimaMedicionLitros: this.toLitros(onlyNode.ultimaMedicion),
          medidoHoy: onlyNode.medidoHoy,
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
          ultimaMedicion: entry.ultimaMedicion,
          ultimaMedicionLitros: this.toLitros(entry.ultimaMedicion),
          medidoHoy: entry.medidoHoy,
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

  private isFechaHoy(fecha: string | null): boolean {
    if (!fecha) {
      return false;
    }

    const parsed = new Date(fecha);
    if (isNaN(parsed.getTime())) {
      return false;
    }

    const hoy = new Date();
    return (
      parsed.getFullYear() === hoy.getFullYear() &&
      parsed.getMonth() === hoy.getMonth() &&
      parsed.getDate() === hoy.getDate()
    );
  }
}
