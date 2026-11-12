import { NgTemplateOutlet } from '@angular/common';
import { ChangeDetectorRef, Component, computed, effect, ElementRef, inject, OnDestroy, OnInit, signal, untracked } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PermissionsService } from '@app/core/services/permissions.service';
import { LocalStorageService } from '@shared/services/local-storage.service';
import { DashboardShellService } from '../navigation/dashboard-shell.service';
import {
  CATALOGOS,
  CONFIGURACION,
  FAVORITOS_INICIALES,
  Funcionalidad,
  GRUPOS,
  normalizarTexto,
  OPERACION,
  REPORTES,
  rutasPermitidas,
  SECCIONES,
  segmentoRuta,
} from '../navigation/funcionalidades.data';

@Component({
  selector: 'app-lista-funcionalidades',
  imports: [RouterLink, NgTemplateOutlet],
  templateUrl: './lista-funcionalidades.component.html',
  styleUrl: './lista-funcionalidades.component.scss',
})
export class ListaFuncionalidadesComponent implements OnInit, OnDestroy {
  private localStorageService = inject(LocalStorageService);
  private permissionsService = inject(PermissionsService);
  private readonly host = inject(ElementRef) as ElementRef<HTMLElement>;
  private readonly cdr = inject(ChangeDetectorRef);
  private blobAnimation?: Animation;
  private melts: HTMLElement[] = [];
  readonly shell = inject(DashboardShellService);

  readonly query = signal('');
  readonly groupFilter = signal('todos');
  readonly viewMode = signal<'grid' | 'list'>('grid');
  readonly editingFavorites = signal(false);
  readonly favoriteRoutes = signal<string[]>(
    this.localStorageService.getCatalogFavorites() ?? FAVORITOS_INICIALES
  );

  private readonly catalogosVisible = signal<Funcionalidad[]>([]);
  private readonly operacionVisible = signal<Funcionalidad[]>([]);
  private readonly configVisible = signal<Funcionalidad[]>([]);
  private readonly reportesVisible = signal<Funcionalidad[]>([]);
  private ultimaSeccion = this.shell.section();

  readonly seccionActual = computed(
    () => SECCIONES.find((seccion) => seccion.key === this.shell.section()) ?? SECCIONES[0]
  );

  readonly filtroActivo = computed(() => {
    const filtro = this.groupFilter();
    if (filtro === 'todos') return 'todos';
    const pertenece = GRUPOS.some((grupo) => grupo.id === filtro && grupo.section === this.shell.section());
    return pertenece ? filtro : 'todos';
  });

  readonly sinModulos = computed(() => this.itemsDeSeccion().length === 0);

  readonly chips = computed(() => {
    const items = this.itemsDeSeccion();
    return GRUPOS.filter(
      (grupo) => grupo.section === this.shell.section() && items.some((item) => item.group === grupo.id)
    );
  });

  readonly favoritos = computed(() => {
    if (this.shell.section() !== 1 || this.filtroActivo() !== 'todos') return [];
    const permitidos = new Map(this.catalogosVisible().map((item) => [item.route, item]));
    return this.favoriteRoutes()
      .map((route) => permitidos.get(route))
      .filter((item): item is Funcionalidad => !!item && this.coincide(item));
  });

  readonly grupos = computed(() => {
    const filtro = this.filtroActivo();
    const items = this.itemsDeSeccion();
    return GRUPOS
      .filter((grupo) => grupo.section === this.shell.section() && (filtro === 'todos' || grupo.id === filtro))
      .map((grupo) => ({
        ...grupo,
        total: items.filter((item) => item.group === grupo.id).length,
        items: items.filter((item) => item.group === grupo.id && this.coincide(item)),
      }))
      .filter((grupo) => grupo.items.length > 0);
  });

  readonly sinResultados = computed(
    () => this.itemsDeSeccion().length > 0 && this.grupos().length === 0 && this.favoritos().length === 0
  );

  constructor() {
    effect(() => {
      const seccion = this.shell.section();
      if (seccion === this.ultimaSeccion) return;
      this.ultimaSeccion = seccion;
      untracked(() => {
        this.query.set('');
        this.groupFilter.set('todos');
        this.editingFavorites.set(false);
      });
    });
  }

  ngOnDestroy(): void {
    this.blobAnimation?.cancel();
    this.limpiarTransicion();
  }

  ngOnInit(): void {
    this.recomputeFromStorage();
    this.permissionsService.refreshOnStartup().subscribe(() => {
      this.recomputeFromStorage();
      this.shell.permisosListos.update((value) => value + 1);
    });
  }

  onQuery(event: Event) {
    this.query.set((event.target as HTMLInputElement).value);
  }

  cambiarVista(mode: 'grid' | 'list') {
    if (mode === this.viewMode()) return;

    const fluido = !this.reducedMotion();
    const salidas = fluido ? this.capturarSalida() : [];

    this.viewMode.set(mode);
    if (!fluido) return;

    this.cdr.detectChanges();
    this.playLiquidThumb(mode);
    this.verterGrupos(salidas);
  }

  toggleFavorito(item: Funcionalidad, event: Event) {
    event.preventDefault();
    event.stopPropagation();
    const actuales = this.favoriteRoutes();
    const siguientes = actuales.includes(item.route)
      ? actuales.filter((route) => route !== item.route)
      : [...actuales, item.route];
    this.favoriteRoutes.set(siguientes);
    this.localStorageService.setCatalogFavorites(siguientes);
  }

  esFavorito(item: Funcionalidad): boolean {
    return this.favoriteRoutes().includes(item.route);
  }

  puedeAbrir(item: Funcionalidad): boolean {
    return item.active && !this.editingFavorites();
  }

  bloquearSiEdita(event: Event, item: Funcionalidad) {
    if (!this.puedeAbrir(item)) event.preventDefault();
  }

  etiquetaConteo(total: number): string {
    const noun = this.seccionActual().noun;
    return `${total} ${noun}${total === 1 ? '' : 's'}`;
  }

  private reducedMotion(): boolean {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  private limpiarTransicion() {
    for (const clone of this.melts) {
      clone.getAnimations().forEach((anim) => anim.cancel());
      clone.remove();
    }
    this.melts = [];
    this.host.nativeElement.querySelectorAll<HTMLElement>('.group').forEach((group) => {
      group.getAnimations().forEach((anim) => anim.cancel());
      group.style.pointerEvents = '';
    });
  }

  private capturarSalida(): HTMLElement[] {
    this.limpiarTransicion();
    const clones: HTMLElement[] = [];
    this.host.nativeElement.querySelectorAll<HTMLElement>('.group').forEach((el) => {
      const rect = el.getBoundingClientRect();
      const clone = el.cloneNode(true) as HTMLElement;
      clone.querySelectorAll<HTMLElement>('[id]').forEach((node) => node.removeAttribute('id'));
      clone.setAttribute('aria-hidden', 'true');
      clone.inert = true;
      clone.style.position = 'fixed';
      clone.style.left = `${rect.left}px`;
      clone.style.top = `${rect.top}px`;
      clone.style.width = `${rect.width}px`;
      clone.style.height = `${rect.height}px`;
      clone.style.margin = '0';
      clone.style.overflow = 'hidden';
      clone.style.pointerEvents = 'none';
      clone.style.zIndex = '30';
      document.body.appendChild(clone);
      clones.push(clone);
    });
    this.melts = clones;
    return clones;
  }

  private playLiquidThumb(mode: 'grid' | 'list') {
    const blob = this.host.nativeElement.querySelector<HTMLElement>('.view-switch-blob');
    if (!blob) return;
    this.blobAnimation?.cancel();
    const origin = mode === 'list' ? '16% 50%' : '84% 50%';
    this.blobAnimation = blob.animate(
      [
        { transform: 'scale(1, 1)', transformOrigin: origin, borderRadius: '0.5rem', offset: 0 },
        { transform: 'scale(1.78, 0.78)', transformOrigin: origin, borderRadius: '999px', offset: 0.36 },
        { transform: 'scale(1.28, 0.9)', transformOrigin: origin, borderRadius: '999px', offset: 0.64 },
        { transform: 'scale(0.92, 1.08)', transformOrigin: origin, borderRadius: '0.7rem', offset: 0.84 },
        { transform: 'scale(1, 1)', transformOrigin: origin, borderRadius: '0.5rem', offset: 1 },
      ],
      { duration: 520, easing: 'cubic-bezier(0.45, 0.05, 0.25, 1)' },
    );
  }

  private verterGrupos(clones: HTMLElement[]) {
    const groups = [...this.host.nativeElement.querySelectorAll<HTMLElement>('.group')];

    for (const clone of clones) {
      const melt = clone.animate(
        [
          { opacity: 1, filter: 'blur(0px)', transform: 'scale(1)', borderRadius: '12px' },
          { opacity: 0, filter: 'blur(5px)', transform: 'scale(0.96)', borderRadius: '28px' },
        ],
        { duration: 380, easing: 'cubic-bezier(0.4, 0, 0.2, 1)', fill: 'forwards' },
      );
      melt.onfinish = () => {
        clone.remove();
        this.melts = this.melts.filter((item) => item !== clone);
      };
    }

    for (const group of groups) {
      group.style.pointerEvents = 'none';
      const form = group.animate(
        [
          { opacity: 0, filter: 'blur(5px)', transform: 'translateY(8px) scale(0.985)' },
          { opacity: 1, filter: 'blur(0px)', transform: 'translateY(0px) scale(1)' },
        ],
        { duration: 460, delay: 70, easing: 'cubic-bezier(0.22, 1, 0.36, 1)', fill: 'both' },
      );
      form.pause();
      form.currentTime = 0;
      form.play();
      const release = () => {
        group.style.pointerEvents = '';
      };
      form.onfinish = () => {
        form.oncancel = null;
        form.cancel();
        release();
      };
      form.oncancel = release;
    }
  }

  private itemsDeSeccion(): Funcionalidad[] {
    switch (this.shell.section()) {
      case 2:
        return this.operacionVisible();
      case 3:
        return this.configVisible();
      case 4:
        return this.reportesVisible();
      default:
        return this.catalogosVisible();
    }
  }

  private coincide(item: Funcionalidad): boolean {
    const q = normalizarTexto(this.query().trim());
    if (!q) return true;
    return normalizarTexto(`${item.label} ${item.description}`).includes(q);
  }

  private recomputeFromStorage() {
    this.applyFirstLevelPermissions();
    this.applySecondLevelPermissions();
  }

  private applyFirstLevelPermissions() {
    const allowedParents = this.localStorageService.getAllowedParents();
    if (!allowedParents || allowedParents.length === 0) return;

    const visibles = SECCIONES.filter((seccion) => allowedParents.includes(seccion.parent));
    if (!visibles.some((seccion) => seccion.key === this.shell.section())) {
      this.shell.fijarSeccion(visibles[0]?.key ?? 1);
    }
  }

  private applySecondLevelPermissions() {
    const allowed = rutasPermitidas(this.localStorageService.getProfiles() ?? []);

    const visibles = (items: Funcionalidad[], extra?: (item: Funcionalidad) => boolean) =>
      items.filter((item) => extra?.(item) || allowed.has(segmentoRuta(item.route)));

    this.catalogosVisible.set(visibles(CATALOGOS));
    this.operacionVisible.set(visibles(OPERACION));
    this.configVisible.set(visibles(CONFIGURACION, (item) => item.route === './configuracion-kpis'));
    this.reportesVisible.set(visibles(REPORTES));
  }
}
