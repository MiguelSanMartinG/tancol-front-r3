import { DatePipe, DecimalPipe } from '@angular/common';
import {
  Component, DestroyRef, ElementRef, ViewChild, afterNextRender, computed, effect, inject, input, output, signal, untracked, viewChild,
} from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { InputNumberModule } from 'primeng/inputnumber';
import { AppPrimengModule } from '@shared/app-primeng/app-primeng.module';
import { AppSharedModule } from '@shared/app-shared.module';
import { DialogEliminarComponent } from '@shared/components/dialog-eliminar/dialog-eliminar.component';
import { DialogSignatureComponent } from '@shared/components/dialog-signature/dialog-signature.component';
import { InventarioDiarioService, iconoInsumo } from '../services/inventario-diario.service';
import { CONCEPTOS, ConceptoEntrega, CupoDiario, ESTATUS_SOLICITUD, EstatusSolicitud, PartidaInventario, ROTO_POR_MAQUINA, SolicitudStock } from '../services/inventario-diario.models';

/** Campos capturables de una partida (fila nueva o diálogo de detalle). */
interface CapturaPartida {
  rutaId: string | null;
  insumoId: string | null;
  cantidad: number | null;
  concepto: ConceptoEntrega | null;
  rotoPor: string | null;
  comentario: string;
  error: string | null;
}

/** Partida nueva capturada directo en la tabla (aún sin guardar). */
interface Borrador extends CapturaPartida {
  id: string;
  borrador: true;
}

/** Diálogo «Detalle de partida» (pantalla completa). */
interface Detalle {
  modo: 'nueva' | 'editar' | 'ver';
  partida: PartidaInventario | null;
  datos: CapturaPartida;
}

type CampoEditable = 'rutaId' | 'insumoId' | 'cantidad' | 'concepto' | 'comentario' | 'rotoPor';

/** Vista de una tarjeta de cupo diario. */
interface Tarjeta {
  clave: string;
  cupo: CupoDiario;
  nombre: string;
  unidad: string;
  icono: string;
  disponible: number;
  tope: number;
  porcentaje: number;
  /** Posición del mínimo en la barra (%). */
  marcaMinimo: number;
  nivel: 'ok' | 'medio' | 'bajo';
  existencia: number;
  almacenNombre: string;
  faltanteDotacion: number;
  /** Solicitud en curso del insumo (Solicitado o Aceptado). */
  solicitud: { folio: string; codigo: EstatusSolicitud; estatus: string; datos: SolicitudStock | null } | null;
  puedeSolicitar: boolean;
  motivoNoSolicitar: string;
  minimizada: boolean;
}

/** Ancho mínimo de tarjeta y separación (px) para calcular cuántas caben por fila. */
const ANCHO_TARJETA = 240;
const SEPARACION = 14;

/** El mínimo para solicitar debe ser menor al cupo base. */
function minimoMenorQueBase(g: AbstractControl): ValidationErrors | null {
  const base = g.get('base')?.value;
  const minimo = g.get('minimo')?.value;
  return base != null && minimo != null && minimo >= base ? { minimoMayor: true } : null;
}

@Component({
  selector: 'app-inventario-dia',
  imports: [AppPrimengModule, AppSharedModule, ReactiveFormsModule, InputNumberModule, DatePipe, DecimalPipe, DialogEliminarComponent, DialogSignatureComponent],
  templateUrl: './inventario-dia.component.html',
  styleUrl: './inventario-dia.component.scss',
})
export class InventarioDiaComponent {
  readonly inv = inject(InventarioDiarioService);
  private readonly fb = inject(FormBuilder);
  private readonly toast = inject(MessageService);

  readonly areaId = input.required<string>();
  readonly empleadoId = input<string | null>(null);
  readonly inicio = input<Date | null>(null);
  readonly fin = input<Date | null>(null);
  /** Lleva a la pestaña de solicitudes y resalta el folio. */
  readonly verSolicitudes = output<string | null>();
  /** Al llegar desde Solicitudes: filtra por el insumo y lleva su tarjeta a la vista. */
  readonly enfocarInsumo = input<{ insumoId: string } | null>(null);

  @ViewChild(DialogSignatureComponent) dialogFirma!: DialogSignatureComponent;
  private readonly carrusel = viewChild<ElementRef<HTMLElement>>('carrusel');

  readonly conceptos = CONCEPTOS;
  readonly rotoPorOpciones = computed(() => [{ label: 'Máquina', value: ROTO_POR_MAQUINA }, ...this.inv.empleados().map((e) => ({ label: e.nombre, value: e.id }))]);
  readonly rutasOpciones = computed(() => this.inv.rutas().map((r) => ({ label: r.nombre, value: r.id })));
  readonly almacenesOpciones = computed(() => this.inv.almacenes().map((a) => ({ label: a.nombre, value: a.id })));

  readonly area = computed(() => this.inv.area(this.areaId()));
  readonly confirmacion = computed(() => this.inv.cupoConfirmado(this.areaId()));
  /** Ya se consultó y el área no ha confirmado el cupo de hoy. */
  readonly pendienteConfirmar = computed(() => this.inv.confirmacionConsultada(this.areaId()) && !this.confirmacion());
  readonly esResponsable = computed(() => this.inv.esResponsableArea(this.areaId()));
  /** Hay un guardado en curso: evita enviarlo dos veces. */
  readonly guardando = signal(false);
  /** Carga de cupos y confirmación del área actual. */
  private cargaArea: Promise<void> = Promise.resolve();

  // ---------------------------------------------------------------- tarjetas

  readonly ordenando = signal(false);
  /** Insumo elegido al hacer clic en una tarjeta: filtra la tabla. */
  readonly insumoFiltro = signal<string | null>(null);
  private arrastrando: number | null = null;
  readonly destinoArrastre = signal<number | null>(null);

  readonly tarjetas = computed<Tarjeta[]>(() => {
    const solicitudes = this.inv.solicitudes();
    const confirmado = !!this.confirmacion();
    const prefs = this.inv.preferencias();
    const minimizadas = new Set(prefs.minimizadas);
    const lista = this.inv.cupos().filter((c) => c.areaId === this.areaId()).map<Tarjeta>((c) => {
      const disponible = c.disponible;
      const tope = Math.max(c.base, c.inicial + c.ampliado);
      const pct = (n: number) => (tope ? Math.max(0, Math.min(100, Math.round((n / tope) * 100))) : 0);
      const porcentaje = pct(disponible);
      const abierta = c.solicitudAbierta;
      const enMinimo = disponible <= c.minimo;
      let motivo = '';
      if (!confirmado) motivo = 'Confirma primero el cupo del día';
      else if (abierta) motivo = `Ya hay una solicitud en curso (${abierta.folio})`;
      else if (!enMinimo) motivo = `Se habilita al llegar a ${c.minimo} o menos`;
      const clave = `${c.areaId}|${c.insumoId}`;
      return {
        clave,
        cupo: c,
        nombre: c.insumoNombre,
        unidad: c.unidad,
        icono: iconoInsumo(c.insumoNombre),
        disponible,
        tope,
        porcentaje,
        marcaMinimo: pct(c.minimo),
        nivel: enMinimo ? 'bajo' : porcentaje <= 40 ? 'medio' : 'ok',
        existencia: c.existencia,
        almacenNombre: c.almacenNombre,
        faltanteDotacion: confirmado ? c.faltante : 0,
        solicitud: abierta
          ? {
              folio: abierta.folio, codigo: abierta.estatus, estatus: ESTATUS_SOLICITUD[abierta.estatus].label,
              datos: solicitudes.find((s) => s.id === abierta.id && s.estatus === abierta.estatus) ?? null,
            }
          : null,
        puedeSolicitar: !motivo,
        motivoNoSolicitar: motivo,
        minimizada: minimizadas.has(clave),
      };
    });
    // Orden guardado por el usuario; las tarjetas sin posición van al final.
    const pos = new Map(prefs.orden.map((k, i) => [k, i]));
    return lista
      .map((t, i) => ({ t, i }))
      .sort((a, b) => (pos.get(a.t.clave) ?? 10_000 + a.i) - (pos.get(b.t.clave) ?? 10_000 + b.i))
      .map(({ t }) => t);
  });

  readonly vistaCompacta = computed(() => this.tarjetas().length > 0 && this.tarjetas().every((t) => t.minimizada));

  // ---- acomodo: máximo dos filas; si no caben, desplazamiento horizontal ----
  private readonly anchoCarrusel = signal(0);
  readonly puedeIzquierda = signal(false);
  readonly puedeDerecha = signal(false);

  readonly acomodo = computed(() => {
    const ancho = this.anchoCarrusel();
    const total = this.tarjetas().length + 1; // + «Agregar insumo»
    if (ancho && ancho < 640) return { modo: 'fila' as const, columnas: null };
    const caben = Math.max(1, Math.floor((ancho + SEPARACION) / (ANCHO_TARJETA + SEPARACION)));
    if (!ancho || total <= caben * 2) return { modo: 'rejilla' as const, columnas: null };
    return { modo: 'dos-filas' as const, columnas: `repeat(${Math.ceil(total / 2)}, ${ANCHO_TARJETA}px)` };
  });

  // ---------------------------------------------------------------- partidas

  readonly borradores = signal<Borrador[]>([]);
  seleccion: PartidaInventario[] = [];

  readonly partidas = computed(() => {
    // El rango y el empleado los filtra el backend.
    const insumo = this.insumoFiltro();
    return this.inv.partidas().filter((p) => p.areaId === this.areaId() && (!insumo || p.insumoId === insumo));
  });

  /** Partidas nuevas arriba, luego las registradas. */
  readonly filas = computed<(Borrador | PartidaInventario)[]>(() => [...this.borradores(), ...this.partidas()]);
  readonly pendientesFirma = computed(() => this.partidas().filter((p) => !p.firma).length);

  readonly insumosDeCupo = computed(() =>
    this.tarjetas().map((t) => ({ label: `${t.nombre} · disponible ${t.disponible}`, value: t.cupo.insumoId })),
  );

  // ---- totalizador (partidas visibles) ----
  readonly resumenPorInsumo = computed(() => {
    const filas = new Map<string, { insumo: string; unidad: string; porConcepto: Record<ConceptoEntrega, number>; total: number; sinFirma: number }>();
    for (const p of this.partidas()) {
      const f = filas.get(p.insumoId) ?? {
        insumo: p.insumoNombre, unidad: this.unidadDe(p), total: 0, sinFirma: 0,
        porConcepto: { VENTA: 0, CAMBIO: 0, CAMBIO_ROTO: 0, DONADO: 0, HUECO: 0 },
      };
      f.porConcepto[p.concepto] += p.cantidad;
      f.total += p.cantidad;
      if (!p.firma) f.sinFirma += 1;
      filas.set(p.insumoId, f);
    }
    return [...filas.values()].sort((a, b) => a.insumo.localeCompare(b.insumo));
  });

  readonly resumenPorRuta = computed(() => {
    const filas = new Map<string, { ruta: string; insumo: string; unidad: string; partidas: number; total: number }>();
    for (const p of this.partidas()) {
      const ruta = p.rutaNombre ?? 'Sin ruta';
      const k = `${ruta}|${p.insumoId}`;
      const f = filas.get(k) ?? { ruta, insumo: p.insumoNombre, unidad: this.unidadDe(p), partidas: 0, total: 0 };
      f.partidas += 1;
      f.total += p.cantidad;
      filas.set(k, f);
    }
    return [...filas.values()].sort((a, b) => a.ruta.localeCompare(b.ruta) || a.insumo.localeCompare(b.insumo));
  });

  /** La partida no trae unidad: se toma de la tarjeta del insumo (si el área aún la tiene). */
  private unidadDe(p: PartidaInventario): string {
    return this.inv.cupo(p.areaId, p.insumoId)?.unidad ?? '—';
  }

  // ---------------------------------------------------------------- diálogos

  readonly dlgConfirmarDia = signal(false);
  readonly dlgCupo = signal<{ modo: 'agregar' | 'editar'; cupo?: CupoDiario } | null>(null);
  /** Diálogo de stock de la tarjeta: pedir, ver/editar mientras espera al almacén, o recibir con firma. */
  readonly dlgStock = signal<{ modo: 'nueva' | 'espera' | 'recibir'; tarjeta: Tarjeta; solicitud: SolicitudStock | null } | null>(null);
  readonly dlgCancelarSolicitud = signal<SolicitudStock | null>(null);
  notaSolicitud = '';
  cantidadRecibida: number | null = null;
  /** Qué se está firmando con el panel de firma. */
  private firmando: { tipo: 'partida'; id: string } | { tipo: 'recibo'; solicitud: SolicitudStock; cantidad: number } | null = null;
  readonly dlgEliminarTarjeta = signal<Tarjeta | null>(null);
  readonly dlgEliminarPartidas = signal(false);
  readonly detalle = signal<Detalle | null>(null);
  partidaFirma: { id: string; firma: string | null } = { id: '', firma: null };

  readonly esMovil = signal(false);

  readonly previa = computed(() => {
    const almacenes = new Map(this.inv.cupos().map((c) => [c.id, c.almacenNombre]));
    return this.inv.previa().map((p) => ({ ...p, almacenNombre: almacenes.get(p.cupoId) ?? '' }));
  });

  formCupo = this.fb.group(
    {
      almacenId: [null as string | null, Validators.required],
      insumoId: [null as string | null, Validators.required],
      base: [25 as number | null, [Validators.required, Validators.min(1)]],
      minimo: [5 as number | null, [Validators.required, Validators.min(0)]],
    },
    { validators: minimoMenorQueBase },
  );
  private readonly almacenCupo = signal<string | null>(null);

  /** Insumos del almacén elegido que el área aún no tiene en tarjeta. */
  readonly insumosParaAgregar = computed(() => {
    const almacenId = this.almacenCupo();
    const usados = new Set(this.inv.cupos().filter((c) => c.areaId === this.areaId()).map((c) => c.insumoId));
    return this.inv.insumosDeAlmacen(almacenId)
      .filter((i) => !usados.has(i.id))
      .map((i) => ({ label: `${i.nombre} · ${i.existencia.toLocaleString('es-MX')} ${i.unidad}`, value: i.id }));
  });

  /** Los insumos se consultan al elegir el almacén, dentro del diálogo. */
  readonly puedeAgregarTarjeta = computed(() => this.inv.almacenes().length > 0);

  cantidadSolicitud: number | null = null;

  constructor() {
    // Al entrar a un área se limpia lo capturado y se consultan sus cupos y su confirmación de hoy.
    effect(() => {
      const area = this.areaId();
      untracked(() => {
        this.seleccion = [];
        this.borradores.set([]);
        this.insumoFiltro.set(null);
        this.cargaArea = this.inv.cargarArea(area);
      });
    });

    effect(() => {
      const filtro = { areaId: this.areaId(), empleadoId: this.empleadoId(), inicio: this.inicio(), fin: this.fin() };
      untracked(() => {
        this.seleccion = [];
        void this.inv.cargarPartidas(filtro);
      });
    });

    // Las tarjetas necesitan las solicitudes abiertas del área, sin importar el empleado filtrado.
    effect(() => {
      const filtro = { areaId: this.areaId(), inicio: this.inicio(), fin: this.fin() };
      untracked(() => void this.inv.cargarSolicitudes(filtro));
    });

    // Confirmación obligatoria: al entrar a un área sin cupo confirmado hoy, se pide confirmarlo.
    effect(() => {
      const pedir = this.pendienteConfirmar() && this.esResponsable();
      untracked(() => {
        if (pedir) void this.abrirConfirmarDia();
        else this.dlgConfirmarDia.set(false);
      });
    });

    effect(() => {
      const foco = this.enfocarInsumo();
      if (!foco) return;
      untracked(() => {
        this.insumoFiltro.set(foco.insumoId);
        void this.cargaArea.then(() =>
          setTimeout(() => this.carrusel()?.nativeElement.querySelector('.idi-card.is-filtro')?.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' }), 200),
        );
      });
    });

    // Al cambiar de almacén se limpia el insumo: cada almacén tiene sus propios insumos.
    this.formCupo.controls.almacenId.valueChanges.subscribe((id) => {
      this.almacenCupo.set(id);
      if (this.dlgCupo()?.modo !== 'agregar') return;
      this.formCupo.controls.insumoId.reset(null);
      if (id) void this.inv.cargarInsumosAlmacen(id);
    });

    // Ancho disponible para decidir el acomodo de las tarjetas y si hay flechas.
    const destroyRef = inject(DestroyRef);
    afterNextRender(() => {
      const el = this.carrusel()?.nativeElement;
      const movil = window.matchMedia('(max-width: 767px)');
      this.esMovil.set(movil.matches);
      const alCambiar = (e: MediaQueryListEvent) => this.esMovil.set(e.matches);
      movil.addEventListener('change', alCambiar);
      if (!el) return;
      const ro = new ResizeObserver(() => {
        this.anchoCarrusel.set(el.clientWidth);
        this.revisarDesplazamiento();
      });
      ro.observe(el);
      destroyRef.onDestroy(() => {
        ro.disconnect();
        movil.removeEventListener('change', alCambiar);
      });
    });
    effect(() => {
      this.acomodo();
      this.tarjetas();
      untracked(() => setTimeout(() => this.revisarDesplazamiento()));
    });
  }

  /** Ejecuta un guardado a la vez; regresa undefined si ya había uno en curso. */
  private async guardar<T>(accion: () => Promise<T>): Promise<T | undefined> {
    if (this.guardando()) return undefined;
    this.guardando.set(true);
    try {
      return await accion();
    } finally {
      this.guardando.set(false);
    }
  }

  private avisarError(summary: string, detail: string) {
    this.toast.add({ key: 'top-right', severity: 'warn', summary, detail });
  }

  // ---- día ----

  /** Consulta la vista previa y abre la confirmación del día. */
  async abrirConfirmarDia() {
    const area = this.areaId();
    const ok = await this.inv.cargarPrevia(area);
    if (ok && area === this.areaId() && this.pendienteConfirmar()) this.dlgConfirmarDia.set(true);
  }

  async confirmarDia() {
    const r = await this.guardar(() => this.inv.confirmarCupoDia(this.areaId()));
    if (!r) return;
    if (r.error) {
      this.avisarError('No se confirmó el cupo', r.error);
      return;
    }
    const incompletos = r.faltantes;
    this.dlgConfirmarDia.set(false);
    this.toast.add({ key: 'top-right', severity: 'success', summary: 'Cupo del día confirmado', detail: `${this.area()?.nombre}: ya puedes registrar partidas.` });
    if (incompletos.length) {
      this.toast.add({
        key: 'top-right', severity: 'warn', summary: 'Dotación incompleta', life: 8000,
        detail: `${incompletos.map((i) => `${i.insumo} (faltaron ${i.faltante})`).join(', ')}. Se notificó al responsable de almacén.`,
      });
    }
  }

  // ---------------------------------------------------------------- tarjetas: orden, minimizar, filtro

  seleccionarTarjeta(t: Tarjeta, event: Event) {
    if (this.ordenando()) return;
    if ((event.target as HTMLElement).closest('button, a, p-button, .idi-badge')) return;
    this.insumoFiltro.update((actual) => (actual === t.cupo.insumoId ? null : t.cupo.insumoId));
  }

  toggleMinimizar(t: Tarjeta) {
    const prefs = this.inv.preferencias();
    const set = new Set(prefs.minimizadas);
    if (set.has(t.clave)) set.delete(t.clave);
    else set.add(t.clave);
    this.inv.guardarPreferencias({ ...prefs, minimizadas: [...set] });
  }

  toggleVistaCompacta() {
    const prefs = this.inv.preferencias();
    const claves = this.tarjetas().map((t) => t.clave);
    const otras = prefs.minimizadas.filter((k) => !claves.includes(k));
    this.inv.guardarPreferencias({ ...prefs, minimizadas: this.vistaCompacta() ? otras : [...otras, ...claves] });
  }

  toggleOrdenar() {
    this.ordenando.update((v) => !v);
    this.destinoArrastre.set(null);
  }

  moverTarjeta(desde: number, hacia: number) {
    const lista = this.tarjetas().map((t) => t.clave);
    if (hacia < 0 || hacia >= lista.length || desde === hacia) return;
    const [k] = lista.splice(desde, 1);
    lista.splice(hacia, 0, k);
    const prefs = this.inv.preferencias();
    const otras = prefs.orden.filter((x) => !lista.includes(x));
    this.inv.guardarPreferencias({ ...prefs, orden: [...lista, ...otras] });
  }

  onDragStart(i: number, e: DragEvent) {
    if (!this.ordenando()) return;
    this.arrastrando = i;
    e.dataTransfer?.setData('text/plain', String(i));
    if (e.dataTransfer) e.dataTransfer.effectAllowed = 'move';
  }

  onDragOver(i: number, e: DragEvent) {
    if (this.arrastrando === null) return;
    e.preventDefault();
    this.destinoArrastre.set(i);
  }

  onDrop(i: number, e: DragEvent) {
    e.preventDefault();
    if (this.arrastrando !== null) this.moverTarjeta(this.arrastrando, i);
    this.onDragEnd();
  }

  onDragEnd() {
    this.arrastrando = null;
    this.destinoArrastre.set(null);
  }

  desplazar(dir: 1 | -1) {
    const el = this.carrusel()?.nativeElement;
    el?.scrollBy({ left: dir * el.clientWidth * 0.8, behavior: 'smooth' });
  }

  revisarDesplazamiento() {
    const el = this.carrusel()?.nativeElement;
    if (!el) return;
    this.puedeIzquierda.set(el.scrollLeft > 4);
    this.puedeDerecha.set(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  }

  nombreInsumoFiltro() {
    const insumo = this.insumoFiltro();
    return insumo ? this.inv.cupo(this.areaId(), insumo)?.insumoNombre ?? '' : '';
  }

  // ---------------------------------------------------------------- partidas: fila nueva

  agregarPartida() {
    if (!this.confirmacion()) return;
    if (this.esMovil()) {
      this.abrirDetalleNuevo();
      return;
    }
    this.borradores.update((bs) => [
      { id: `b-${Date.now()}-${bs.length}`, borrador: true, ...this.capturaVacia() },
      ...bs,
    ]);
  }

  private capturaVacia(): CapturaPartida {
    return { rutaId: null, insumoId: this.insumoFiltro(), cantidad: null, concepto: null, rotoPor: null, comentario: '', error: null };
  }

  esBorrador(f: Borrador | PartidaInventario): f is Borrador {
    return 'borrador' in f;
  }

  /** Disponible para la captura; al editar una partida se suma lo que ya tiene. */
  disponibleDe(c: CapturaPartida, partida: PartidaInventario | null = null): number | null {
    const cupo = c.insumoId ? this.inv.cupo(this.areaId(), c.insumoId) : null;
    if (!cupo) return null;
    return cupo.disponible + (partida && partida.insumoId === c.insumoId ? partida.cantidad : 0);
  }

  /** Revalida la captura al cambiar cualquier campo. */
  revisarCaptura(c: CapturaPartida, partida: PartidaInventario | null = null) {
    if (c.concepto !== 'CAMBIO_ROTO') c.rotoPor = null;
    const disp = this.disponibleDe(c, partida);
    c.error = disp != null && c.cantidad != null && c.cantidad > disp ? `Supera el cupo disponible (${disp}).` : null;
  }

  capturaValida(c: CapturaPartida): boolean {
    return !!c.insumoId && !!c.cantidad && c.cantidad >= 1 && !!c.concepto && (c.concepto !== 'CAMBIO_ROTO' || !!c.rotoPor) && !c.error;
  }

  firmanteDe(c: CapturaPartida): string {
    if (c.concepto === 'CAMBIO_ROTO' && c.rotoPor && c.rotoPor !== ROTO_POR_MAQUINA) return this.inv.empleado(c.rotoPor)?.nombre ?? '';
    return this.inv.usuarioActual();
  }

  /** Registra la captura como partida nueva. Devuelve true si se guardó. */
  private async registrar(c: CapturaPartida): Promise<boolean> {
    this.revisarCaptura(c);
    if (!this.capturaValida(c)) return false;
    const error = await this.guardar(() => this.inv.agregarPartida({
      areaId: this.areaId(), rutaId: c.rutaId, insumoId: c.insumoId!, cantidad: c.cantidad!,
      concepto: c.concepto!, comentario: c.comentario ?? '', rotoPor: c.rotoPor,
    }));
    if (error === undefined) return false;
    if (error) {
      // No se deja en c.error: es del servidor y bloquearía «Guardar» hasta cambiar un campo.
      this.avisarError('No se registró', error);
      return false;
    }
    this.toast.add({ key: 'top-right', severity: 'success', summary: 'Partida registrada', detail: 'Pendiente de firma.' });
    return true;
  }

  async guardarFila(b: Borrador) {
    if (await this.registrar(b)) this.descartarFila(b);
  }

  descartarFila(b: Borrador) {
    this.borradores.update((bs) => bs.filter((x) => x.id !== b.id));
  }

  // ---------------------------------------------------------------- partidas: edición por celda (sin firma)

  /** Ediciones en curso: Enter y salir de la celda disparan el mismo cambio. */
  private readonly editando = new Set<string>();

  async editarCampo(p: PartidaInventario, campo: CampoEditable, valor: unknown) {
    if (p.firma) return;
    let v = valor;
    if (campo === 'cantidad') {
      const n = Number(String(valor ?? '').replace(/[^\d]/g, ''));
      if (!n || n === p.cantidad) return;
      v = n;
    }
    if (campo === 'comentario') v = String(valor ?? '').trim();
    if ((p as unknown as Record<string, unknown>)[campo] === v) return;
    // Cambiar a «Cambio por roto» exige elegir quién lo rompió: se completa en el detalle.
    if (campo === 'concepto' && v === 'CAMBIO_ROTO' && !p.rotoPor) {
      this.abrirDetalle(p, { concepto: 'CAMBIO_ROTO' });
      return;
    }
    const clave = `${p.id}|${campo}|${v}`;
    if (this.editando.has(clave)) return;
    this.editando.add(clave);
    const error = await this.inv.editarPartida(p, { [campo]: v });
    this.editando.delete(clave);
    if (error) {
      this.avisarError('No se actualizó', error);
      return;
    }
    this.seleccion = this.seleccion.filter((s) => s.id !== p.id);
  }

  // ---------------------------------------------------------------- detalle (pantalla completa)

  abrirDetalle(p: PartidaInventario, cambios: Partial<CapturaPartida> = {}) {
    const datos: CapturaPartida = {
      rutaId: p.rutaId, insumoId: p.insumoId, cantidad: p.cantidad, concepto: p.concepto,
      rotoPor: p.rotoPor, comentario: p.comentario, error: null, ...cambios,
    };
    this.detalle.set({ modo: p.firma ? 'ver' : 'editar', partida: p, datos });
  }

  abrirDetalleNuevo() {
    this.detalle.set({ modo: 'nueva', partida: null, datos: this.capturaVacia() });
  }

  /** Lleva una fila nueva al detalle para capturarla con más espacio. */
  expandirBorrador(b: Borrador) {
    this.descartarFila(b);
    const { id: _id, borrador: _b, ...datos } = b;
    this.detalle.set({ modo: 'nueva', partida: null, datos });
  }

  async guardarDetalle() {
    const d = this.detalle();
    if (!d) return;
    if (d.modo === 'nueva') {
      if (await this.registrar(d.datos)) this.detalle.set(null);
      return;
    }
    const partida = d.partida;
    if (d.modo !== 'editar' || !partida) return;
    this.revisarCaptura(d.datos, partida);
    if (!this.capturaValida(d.datos)) return;
    const { rutaId, insumoId, cantidad, concepto, rotoPor, comentario } = d.datos;
    const error = await this.guardar(() => this.inv.editarPartida(partida, {
      rutaId, insumoId: insumoId!, cantidad: cantidad!, concepto: concepto!, rotoPor, comentario: (comentario ?? '').trim(),
    }));
    if (error === undefined) return;
    if (error) {
      this.avisarError('No se actualizó', error);
      return;
    }
    this.detalle.set(null);
    this.toast.add({ key: 'top-right', severity: 'success', summary: 'Partida actualizada', detail: partida.folio });
  }

  firmarDesdeDetalle() {
    const p = this.detalle()?.partida;
    if (!p) return;
    this.detalle.set(null);
    setTimeout(() => this.abrirFirma(p), 250);
  }

  // ---------------------------------------------------------------- firma

  /** Ícono de firma: si falta, abre el panel de firma; si ya está firmada, muestra el detalle. */
  accionFirma(p: PartidaInventario) {
    if (p.firma) this.abrirDetalle(p);
    else this.abrirFirma(p);
  }

  abrirFirma(p: PartidaInventario) {
    if (p.firma) return;
    this.firmando = { tipo: 'partida', id: p.id };
    this.partidaFirma = { id: p.id, firma: null };
    setTimeout(() => this.dialogFirma.open(p.firmante));
  }

  /** El panel de firma entrega la imagen PNG como archivo. */
  async firmaConfirmada(archivo: Blob) {
    const f = this.firmando;
    this.firmando = null;
    if (!f) return;
    if (f.tipo === 'recibo') {
      await this.reciboFirmado(f.solicitud, f.cantidad, archivo);
      return;
    }
    const error = await this.guardar(() => this.inv.firmarPartida(f.id, archivo));
    if (error === undefined) return;
    if (error) {
      this.avisarError('No se firmó', error);
      return;
    }
    this.seleccion = this.seleccion.filter((s) => s.id !== f.id);
    this.toast.add({ key: 'top-right', severity: 'success', summary: 'Partida firmada', detail: 'La partida quedó bloqueada.' });
  }

  get sinFirmaSeleccionadas() {
    return this.seleccion.filter((p) => !this.esBorrador(p) && !p.firma);
  }

  /** Solo las partidas guardadas y sin firma se pueden seleccionar. */
  readonly filaSeleccionable = ({ data }: { data: Borrador | PartidaInventario }) => !('borrador' in data) && !data.firma;

  async eliminarPartidas() {
    const r = await this.guardar(() => this.inv.eliminarPartidas(this.areaId(), this.sinFirmaSeleccionadas.map((p) => p.id)));
    if (!r) return;
    if (r.error) {
      this.avisarError('No se eliminaron', r.error);
      return;
    }
    this.seleccion = [];
    this.dlgEliminarPartidas.set(false);
    this.toast.add({ key: 'top-right', severity: 'success', summary: 'Partidas eliminadas', detail: `${r.eliminadas} partida(s); la cantidad regresó al cupo y al almacén.` });
  }

  conceptoLabel(c: ConceptoEntrega | null) {
    return CONCEPTOS.find((x) => x.value === c)?.label ?? '—';
  }

  // ---------------------------------------------------------------- tarjetas: alta, edición, baja

  abrirAgregarTarjeta() {
    this.formCupo.controls.almacenId.enable({ emitEvent: false });
    this.formCupo.controls.insumoId.enable({ emitEvent: false });
    // Antes del reset: en modo «agregar», al fijar el almacén se consultan sus insumos.
    this.dlgCupo.set({ modo: 'agregar' });
    this.formCupo.reset({ almacenId: this.area()?.almacenId ?? null, insumoId: null, base: 25, minimo: 5 });
  }

  abrirEditarTarjeta(t: Tarjeta) {
    this.dlgCupo.set({ modo: 'editar', cupo: t.cupo });
    this.formCupo.reset({ almacenId: t.cupo.almacenId, insumoId: t.cupo.insumoId, base: t.cupo.base, minimo: t.cupo.minimo });
    this.formCupo.controls.almacenId.disable();
    this.formCupo.controls.insumoId.disable();
  }

  /** Existencia del insumo en el almacén elegido (diálogo de tarjeta). */
  existenciaCupo(): number | null {
    return this.insumoElegido()?.existencia ?? null;
  }

  unidadCupo(): string {
    return this.insumoElegido()?.unidad ?? '';
  }

  nombreInsumoCupo(): string {
    return this.dlgCupo()?.cupo?.insumoNombre ?? '';
  }

  nombreAlmacenCupo(): string {
    return this.dlgCupo()?.cupo?.almacenNombre ?? this.inv.almacen(this.formCupo.getRawValue().almacenId)?.nombre ?? '';
  }

  /** Insumo del diálogo: el de la tarjeta al editar, o el elegido en el almacén al agregar. */
  private insumoElegido(): { existencia: number; unidad: string } | undefined {
    const cupo = this.dlgCupo()?.cupo;
    if (cupo) return cupo;
    const v = this.formCupo.getRawValue();
    return this.inv.insumosDeAlmacen(v.almacenId).find((i) => i.id === v.insumoId);
  }

  async guardarTarjeta() {
    const d = this.dlgCupo();
    const v = this.formCupo.getRawValue();
    if (!d || this.formCupo.invalid) return;
    const error = await this.guardar(() => d.modo === 'agregar'
      ? this.inv.agregarCupo(this.areaId(), v.almacenId!, v.insumoId!, v.base!, v.minimo!)
      : this.inv.editarCupo(d.cupo!, v.base!, v.minimo!));
    if (error === undefined) return;
    if (error) {
      this.avisarError('No se guardó', error);
      return;
    }
    this.dlgCupo.set(null);
    this.toast.add({ key: 'top-right', severity: 'success', summary: d.modo === 'agregar' ? 'Insumo agregado' : 'Tarjeta actualizada' });
  }

  async confirmarEliminarTarjeta() {
    const t = this.dlgEliminarTarjeta();
    if (!t || t.cupo.porDefecto) return;
    const error = await this.guardar(() => this.inv.eliminarCupo(t.cupo));
    if (error === undefined) return;
    if (error) {
      this.avisarError('No se eliminó', error);
      return;
    }
    if (this.insumoFiltro() === t.cupo.insumoId) this.insumoFiltro.set(null);
    this.dlgEliminarTarjeta.set(null);
    this.toast.add({ key: 'top-right', severity: 'success', summary: 'Tarjeta eliminada', detail: t.nombre });
  }

  // ---- stock desde la tarjeta: pedir → esperar al almacén → recibir y firmar ----

  /** Botón principal de la tarjeta según el momento de la solicitud. */
  accionStock(t: Tarjeta) {
    const s = t.solicitud?.datos;
    if (!s) {
      // Con solicitud abierta cuyos datos aún cargan, puedeSolicitar ya es false.
      if (!t.puedeSolicitar) return;
      this.cantidadSolicitud = Math.max(1, t.cupo.base - t.disponible);
      this.notaSolicitud = '';
      this.dlgStock.set({ modo: 'nueva', tarjeta: t, solicitud: null });
      return;
    }
    if (s.estatus === 'SOLICITADO') {
      this.cantidadSolicitud = s.cantidadSolicitada;
      this.notaSolicitud = s.nota;
      this.dlgStock.set({ modo: 'espera', tarjeta: t, solicitud: s });
      return;
    }
    this.cantidadRecibida = s.cantidadRecibida ?? s.cantidadAEntregar;
    this.dlgStock.set({ modo: 'recibir', tarjeta: t, solicitud: s });
  }

  async enviarSolicitud() {
    const d = this.dlgStock();
    const cantidad = this.cantidadSolicitud;
    if (!d || !cantidad) return;
    const error = await this.guardar(() => this.inv.solicitar(this.areaId(), d.tarjeta.cupo.insumoId, cantidad, this.notaSolicitud));
    if (error === undefined) return;
    if (error) {
      this.avisarError('No se envió', error);
      return;
    }
    this.dlgStock.set(null);
    this.toast.add({ key: 'top-right', severity: 'success', summary: 'Solicitud enviada', detail: `Se notificó al responsable de ${d.tarjeta.almacenNombre}.` });
  }

  async actualizarSolicitud() {
    const s = this.dlgStock()?.solicitud;
    const cantidad = this.cantidadSolicitud;
    if (!s || !cantidad) return;
    const error = await this.guardar(() => this.inv.editarSolicitud(s, { cantidadSolicitada: cantidad, nota: this.notaSolicitud.trim() }));
    if (error === undefined) return;
    if (error) {
      this.avisarError('No se actualizó', error);
      return;
    }
    this.dlgStock.set(null);
    this.toast.add({ key: 'top-right', severity: 'success', summary: 'Solicitud actualizada', detail: s.folio });
  }

  pedirCancelarSolicitud() {
    const s = this.dlgStock()?.solicitud;
    if (!s) return;
    this.dlgStock.set(null);
    this.dlgCancelarSolicitud.set(s);
  }

  async confirmarCancelarSolicitud() {
    const s = this.dlgCancelarSolicitud();
    if (!s) return;
    const error = await this.guardar(() => this.inv.cancelarSolicitud(s));
    if (error === undefined) return;
    if (error) {
      this.avisarError('No se canceló', error);
      return;
    }
    this.dlgCancelarSolicitud.set(null);
    this.toast.add({ key: 'top-right', severity: 'success', summary: 'Solicitud cancelada', detail: s.folio });
  }

  /** Cierra el diálogo y abre la firma de recibido (la cantidad se suma al cupo al firmar). */
  async firmarRecibo() {
    const s = this.dlgStock()?.solicitud;
    const cantidad = this.cantidadRecibida;
    const max = s?.cantidadAEntregar ?? 0;
    if (!s || !cantidad || cantidad < 1 || cantidad > max) return;
    // Se guarda lo capturado por si la firma queda pendiente.
    const error = await this.guardar(() => this.inv.editarSolicitud(s, { cantidadRecibida: cantidad }));
    if (error === undefined) return;
    if (error) {
      this.avisarError('No se actualizó', error);
      return;
    }
    this.firmando = { tipo: 'recibo', solicitud: s, cantidad };
    this.partidaFirma = { id: s.id, firma: null };
    this.dlgStock.set(null);
    setTimeout(() => this.dialogFirma.open(this.inv.usuarioActual()), 250);
  }

  private async reciboFirmado(s: SolicitudStock, cantidad: number, firma: Blob) {
    const error = await this.guardar(() => this.inv.recibirSolicitud(s, cantidad, firma));
    if (error === undefined) return;
    if (error) {
      this.avisarError('No se recibió el stock', error);
      return;
    }
    this.toast.add({
      key: 'top-right', severity: 'success', summary: 'Stock recibido',
      detail: `${s.insumoNombre}: +${cantidad} al cupo de hoy.`,
    });
  }
}
