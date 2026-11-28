import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, firstValueFrom } from 'rxjs';
import { DialogErrorService } from '@shared/components/error-modal/dialog-error.service';
import { environment } from '../../../../../environments/environment';
import {
  AlmacenInventario,
  AreaInventario,
  CatalogosInventario,
  ConfirmacionDia,
  CupoDiario,
  EntregaConfirmada,
  EmpleadoInventario,
  EstatusSolicitud,
  FaltanteDotacion,
  InsumoInventario,
  MisPermisos,
  PartidaInventario,
  PartidaNueva,
  PreferenciasTarjetas,
  PreviaConfirmacion,
  ROTO_POR_MAQUINA,
  RutaInventario,
  SolicitudStock,
} from './inventario-diario.models';

const BASE = 'inventario-diario';

export interface FiltroPartidas {
  areaId: string;
  inicio: Date | null;
  fin: Date | null;
  empleadoId: string | null;
}

export interface FiltroSolicitudes {
  areaId?: string | null;
  inicio?: Date | null;
  fin?: Date | null;
  empleadoId?: string | null;
  estatus?: EstatusSolicitud;
}

type CambiosPartida = Partial<Pick<PartidaInventario, 'rutaId' | 'insumoId' | 'cantidad' | 'concepto' | 'comentario' | 'rotoPor'>>;

/** Fechas como llegan de la API (texto ISO) en lugar de Date. */
type Json<T> = { [K in keyof T]: T[K] extends Date ? string : T[K] extends Date | null ? string | null : T[K] };

/**
 * Inventario diario de insumos.
 *
 * Las señales son la caché de lo que regresa la API; las pantallas leen de ellas. El backend calcula
 * cupos, existencias y valida las reglas. Los métodos que modifican regresan el mensaje de error
 * para el usuario, o null si todo salió bien, y refrescan lo que cambió.
 */
@Injectable({ providedIn: 'root' })
export class InventarioDiarioService {
  private readonly http = inject(HttpClient);
  private readonly dialogError = inject(DialogErrorService);

  // ---- Permisos del usuario en sesión ----
  private readonly permisos = signal<MisPermisos>({ esAdmin: false, responsableArea: [], responsableAlmacen: [] });
  /** Tiene al menos un almacén a cargo. */
  readonly tieneAlmacenACargo = computed(() => this.permisos().responsableAlmacen.length > 0);

  // ---- Catálogos ----
  readonly areas = signal<AreaInventario[]>([]);
  readonly almacenes = signal<AlmacenInventario[]>([]);
  readonly empleados = signal<EmpleadoInventario[]>([]);
  readonly rutas = signal<RutaInventario[]>([]);
  /** Insumos por almacén (se piden al elegir el almacén). */
  private readonly insumosPorAlmacen = signal<Record<string, InsumoInventario[]>>({});

  /** Partidas de hoy sin firmar por tarjeta (`${areaId}|${insumoId}` → cantidad). */
  private readonly pendientesHoy = signal<Record<string, number>>({});
  /** Foto de cada insumo según el catálogo de productos (id → archivo). */
  private readonly fotos = signal<Record<string, string>>({});
  private fotosPedidas = false;

  /**
   * Almacenes que puede usar el usuario al agregar tarjetas: los que tiene a cargo y los de sus áreas.
   * El administrador, o quien no tiene ninguno asignado, ve todos.
   */
  readonly almacenesPermitidos = computed(() => {
    const todos = this.almacenes();
    const p = this.permisos();
    if (p.esAdmin) return todos;
    const ids = new Set([
      ...p.responsableAlmacen,
      ...this.areas().filter((a) => p.responsableArea.includes(a.id) && a.almacenId).map((a) => a.almacenId!),
    ]);
    const propios = todos.filter((a) => ids.has(a.id));
    return propios.length ? propios : todos;
  });

  /** Orden y tarjetas minimizadas del usuario en sesión. */
  readonly preferencias = signal<PreferenciasTarjetas>({ orden: [], minimizadas: [] });

  readonly cupos = signal<CupoDiario[]>([]);
  readonly partidas = signal<PartidaInventario[]>([]);
  readonly solicitudes = signal<SolicitudStock[]>([]);
  readonly confirmaciones = signal<ConfirmacionDia[]>([]);
  readonly previa = signal<PreviaConfirmacion[]>([]);
  /** Áreas cuya confirmación ya se consultó (`${areaId}|${fecha}`). */
  private readonly confirmacionesConsultadas = signal<string[]>([]);

  /** Últimos filtros usados: con ellos se refresca después de guardar. */
  private filtroPartidas: FiltroPartidas | null = null;
  private filtroSolicitudes: FiltroSolicitudes | null = null;
  /** Usuario cuyos datos están en caché. */
  private claveUsuario: string | null = null;
  /** Número de la última consulta por tipo: descarta respuestas que llegan tarde. */
  private readonly turnos: Record<string, number> = {};

  readonly pendientesConfirmacion = computed(() => this.solicitudes().filter((s) => s.estatus === 'SOLICITADO').length);

  // ---------------------------------------------------------------- consultas

  /** Catálogos y permisos: se piden al entrar a cada pantalla. */
  async cargarInicial(): Promise<void> {
    const clave = clavePreferencias();
    if (clave !== this.claveUsuario) {
      this.claveUsuario = clave;
      this.permisos.set({ esAdmin: false, responsableArea: [], responsableAlmacen: [] });
      this.cupos.set([]);
      this.partidas.set([]);
      this.solicitudes.set([]);
      this.confirmaciones.set([]);
      this.confirmacionesConsultadas.set([]);
      this.pendientesHoy.set({});
      this.cargarPreferencias(clave);
    }
    const [catalogos, permisos] = await Promise.all([
      this.leer(this.http.get<CatalogosInventario>(`${BASE}/catalogos`)),
      this.leer(this.http.get<MisPermisos>(`${BASE}/mis-permisos`)),
    ]);
    if (permisos) this.permisos.set(permisos);
    if (catalogos) {
      this.areas.set(catalogos.areas);
      this.almacenes.set(catalogos.almacenes);
      this.empleados.set(catalogos.empleados);
      this.rutas.set(catalogos.rutas);
    }
    void this.cargarFotos();
  }

  /** Fotos de los insumos (catálogo de productos). Se piden una vez; si falla, se ven los íconos. */
  private async cargarFotos(): Promise<void> {
    if (this.fotosPedidas) return;
    this.fotosPedidas = true;
    const productos = await this.leer(this.http.get<{ idProducto?: string; id?: string; idImagen?: string | null }[]>('producto'));
    if (!productos) {
      this.fotosPedidas = false;
      return;
    }
    const fotos: Record<string, string> = {};
    for (const p of productos) {
      const id = p.idProducto ?? p.id;
      if (id && p.idImagen) fotos[id] = p.idImagen;
    }
    this.fotos.set(fotos);
  }

  /** Dirección de la foto del insumo de la tarjeta, o null si no tiene. */
  fotoDe(cupo: Pick<CupoDiario, 'insumoId' | 'idImagen'>): string | null {
    const archivo = cupo.idImagen ?? this.fotos()[cupo.insumoId];
    return archivo ? `${environment.apiUrl}images/${encodeURIComponent(archivo)}` : null;
  }

  /**
   * Con cuánto inició el día la tarjeta. Si nadie inició el día (es opcional), se trabaja con la base.
   */
  inicialDe(cupo: CupoDiario): number {
    return this.cupoConfirmado(cupo.areaId) ? cupo.inicial : cupo.inicial || cupo.base;
  }

  /** Lo que aún se puede registrar en la tarjeta, sin esperar a que se inicie el día. */
  libreDe(cupo: CupoDiario): number {
    if (this.cupoConfirmado(cupo.areaId) || cupo.inicial) return cupo.disponible;
    return cupo.base + cupo.ampliado - cupo.consumido;
  }

  /** Lo que la tarjeta tiene registrado sin firmar hoy (no descuenta hasta firmarse). */
  pendienteDe(cupo: CupoDiario): number {
    return cupo.pendienteFirma ?? this.pendientesHoy()[`${cupo.areaId}|${cupo.insumoId}`] ?? 0;
  }

  /** Insumos con registro en el almacén, o null si aún no se sabe. */
  totalInsumos(almacenId: string): number | null {
    const a = this.almacen(almacenId);
    if (a?.totalInsumos != null) return a.totalInsumos;
    const lista = this.insumosPorAlmacen()[almacenId];
    return lista ? lista.length : null;
  }

  /** Cuenta los insumos de los almacenes que aún no se conocen (para el selector de «Agregar insumo»). */
  async cargarConteos(almacenIds: string[]): Promise<void> {
    const faltan = almacenIds.filter((id) => this.totalInsumos(id) === null);
    await Promise.all(faltan.map((id) => this.cargarInsumosAlmacen(id)));
  }

  /** Id del empleado en sesión. */
  idUsuarioActual(): string | null {
    try {
      return JSON.parse(localStorage.getItem('userInfo') ?? 'null')?.idEmpleado ?? null;
    } catch {
      return null;
    }
  }

  /** Solo quien agregó la tarjeta la puede eliminar; las tarjetas por defecto no se eliminan. */
  puedeEliminarCupo(cupo: CupoDiario): boolean {
    const yo = this.idUsuarioActual();
    return !cupo.porDefecto && !!yo && cupo.creadoPorId === yo;
  }

  usuarioActual(): string {
    try {
      const info = JSON.parse(localStorage.getItem('userInfo') ?? 'null');
      const nombre = [info?.nombre, info?.apellidoPaterno].filter(Boolean).join(' ').trim();
      return nombre || info?.nombreUsuario || 'Usuario en sesión';
    } catch {
      return 'Usuario en sesión';
    }
  }

  /** Permiso «Responsable de área»: confirma el cupo al iniciar el día. */
  esResponsableArea(areaId: string | null | undefined): boolean {
    return !!areaId && this.permisos().responsableArea.includes(areaId);
  }

  /** Permiso «Responsable de almacén»: acepta o rechaza solicitudes de stock. */
  esResponsableAlmacen(almacenId: string | null | undefined): boolean {
    return !!almacenId && this.permisos().responsableAlmacen.includes(almacenId);
  }

  area(id: string | null | undefined) { return this.areas().find((a) => a.id === id); }
  almacen(id: string | null | undefined) { return this.almacenes().find((a) => a.id === id); }
  empleado(id: string | null | undefined) { return this.empleados().find((e) => e.id === id); }

  nombreRotoPor(p: Pick<PartidaInventario, 'rotoPor' | 'rotoPorNombre'>): string {
    if (!p.rotoPor) return '—';
    if (p.rotoPor === ROTO_POR_MAQUINA) return 'Máquina';
    return p.rotoPorNombre ?? this.empleado(p.rotoPor)?.nombre ?? '—';
  }

  /** Dirección de la imagen de una firma guardada. */
  urlFirma(firma: string): string {
    return environment.apiUrl + 'images/' + firma;
  }

  /** Insumos registrados en el inventario del almacén (ya consultados con `cargarInsumosAlmacen`). */
  insumosDeAlmacen(almacenId: string | null | undefined): InsumoInventario[] {
    return almacenId ? this.insumosPorAlmacen()[almacenId] ?? [] : [];
  }

  cupo(areaId: string, insumoId: string): CupoDiario | undefined {
    return this.cupos().find((c) => c.areaId === areaId && c.insumoId === insumoId);
  }

  cupoConfirmado(areaId: string): ConfirmacionDia | undefined {
    const dia = hoyMexico();
    return this.confirmaciones().find((c) => c.areaId === areaId && c.fecha === dia);
  }

  /** Ya se sabe si el área confirmó o no el cupo de hoy. */
  confirmacionConsultada(areaId: string): boolean {
    return this.confirmacionesConsultadas().includes(`${areaId}|${hoyMexico()}`);
  }

  async cargarInsumosAlmacen(almacenId: string): Promise<void> {
    const insumos = await this.leer(this.http.get<InsumoInventario[]>(`${BASE}/almacenes/${almacenId}/insumos`));
    if (insumos) this.insumosPorAlmacen.update((m) => ({ ...m, [almacenId]: insumos }));
  }

  /** Cupos y confirmación de hoy. En orden: la primera consulta de cupos crea las tarjetas por defecto. */
  async cargarArea(areaId: string): Promise<void> {
    this.confirmacionesConsultadas.update((cs) => cs.filter((c) => !c.startsWith(`${areaId}|`)));
    await this.cargarCupos(areaId);
    await Promise.all([this.cargarConfirmacion(areaId), this.cargarPendientes(areaId)]);
  }

  /** Partidas de hoy sin firmar del área, sin importar los filtros de la tabla. */
  private async cargarPendientes(areaId: string): Promise<void> {
    const vigente = this.tomarTurno(`pendientes|${areaId}`);
    const hoy = hoyMexico();
    const partidas = await this.leer(
      this.http.get<Json<PartidaInventario>[]>(`${BASE}/partidas`, { params: { areaId, inicio: hoy, fin: hoy } }),
    );
    if (!partidas || !vigente()) return;
    const suma: Record<string, number> = {};
    for (const p of partidas) {
      if (p.firma || p.areaId !== areaId) continue;
      const k = `${areaId}|${p.insumoId}`;
      suma[k] = (suma[k] ?? 0) + p.cantidad;
    }
    this.pendientesHoy.update((m) => {
      const otras = Object.fromEntries(Object.entries(m).filter(([k]) => !k.startsWith(`${areaId}|`)));
      return { ...otras, ...suma };
    });
  }

  private async cargarCupos(areaId: string): Promise<void> {
    const vigente = this.tomarTurno(`cupos|${areaId}`);
    const cupos = await this.leer(
      this.http.get<CupoDiario[]>(`${BASE}/areas/${areaId}/cupos`, { params: { fecha: hoyMexico() } }),
    );
    if (cupos && vigente()) this.cupos.update((cs) => [...cs.filter((c) => c.areaId !== areaId), ...cupos]);
  }

  private async cargarConfirmacion(areaId: string): Promise<void> {
    const vigente = this.tomarTurno(`confirmacion|${areaId}`);
    const fecha = hoyMexico();
    const c = await this.leer(
      this.http.get<Json<ConfirmacionDia> | null>(`${BASE}/areas/${areaId}/confirmacion`, { params: { fecha } }),
    );
    if (c === undefined || !vigente()) return;
    this.guardarConfirmacion(areaId, fecha, c);
  }

  private guardarConfirmacion(areaId: string, fecha: string, c: Json<ConfirmacionDia> | null) {
    this.confirmaciones.update((cs) => [
      ...cs.filter((x) => x.areaId !== areaId),
      ...(c ? [{ ...c, confirmadoEn: new Date(c.confirmadoEn) }] : []),
    ]);
    const clave = `${areaId}|${fecha}`;
    this.confirmacionesConsultadas.update((cs) => [...cs.filter((x) => x !== clave), clave]);
  }

  /** Lo que se entregará al confirmar el día. Regresa false si no se pudo consultar. */
  async cargarPrevia(areaId: string): Promise<boolean> {
    const vigente = this.tomarTurno('previa');
    const previa = await this.leer(this.http.get<PreviaConfirmacion[]>(`${BASE}/areas/${areaId}/confirmacion/previa`));
    if (!previa || !vigente()) return false;
    this.previa.set(previa);
    return true;
  }

  async cargarPartidas(filtro: FiltroPartidas): Promise<void> {
    this.filtroPartidas = filtro;
    const vigente = this.tomarTurno('partidas');
    const partidas = await this.leer(
      this.http.get<Json<PartidaInventario>[]>(`${BASE}/partidas`, { params: parametros(filtro) }),
    );
    if (partidas && vigente()) this.partidas.set(partidas.map(aPartida));
  }

  async cargarSolicitudes(filtro: FiltroSolicitudes): Promise<void> {
    this.filtroSolicitudes = filtro;
    const vigente = this.tomarTurno('solicitudes');
    const solicitudes = await this.consultarSolicitudes(filtro);
    if (solicitudes && vigente()) this.solicitudes.set(solicitudes);
  }

  /** Busca una solicitud por folio (al llegar desde una notificación). */
  async buscarSolicitud(folio: string): Promise<SolicitudStock | undefined> {
    const solicitudes = await this.leer(
      this.http.get<Json<SolicitudStock>[]>(`${BASE}/solicitudes`, { params: { folio } }),
    );
    return solicitudes?.map(aSolicitud).find((s) => s.folio === folio);
  }

  private async consultarSolicitudes(filtro: FiltroSolicitudes): Promise<SolicitudStock[] | undefined> {
    const solicitudes = await this.leer(
      this.http.get<Json<SolicitudStock>[]>(`${BASE}/solicitudes`, { params: parametros(filtro) }),
    );
    return solicitudes?.map(aSolicitud);
  }

  // ---------------------------------------------------------------- cupos

  /**
   * Confirma el cupo del día con lo que el responsable decidió entregar por insumo. El backend registra
   * cada entrega como «Dotación del día» en las solicitudes de stock.
   */
  async confirmarCupoDia(areaId: string, entregas: EntregaConfirmada[]): Promise<{ error: string | null; faltantes: FaltanteDotacion[] }> {
    const { error, dato } = await this.mutar(
      this.http.post<{ confirmacion: Json<ConfirmacionDia>; faltantes: FaltanteDotacion[] }>(`${BASE}/confirmaciones`, { areaId, entregas }),
      (r) => {
        this.guardarConfirmacion(areaId, r.confirmacion.fecha, r.confirmacion);
        return Promise.all([this.cargarCupos(areaId), this.recargarSolicitudes()]);
      },
    );
    return { error, faltantes: dato?.faltantes ?? [] };
  }

  /** Tarjeta agregada al área (sí se puede eliminar). */
  async agregarCupo(areaId: string, almacenId: string, insumoId: string, base: number, minimo: number): Promise<string | null> {
    const r = await this.mutar(
      this.http.post<CupoDiario>(`${BASE}/cupos`, { areaId, almacenId, insumoId, base, minimo }),
      () => this.cargarCupos(areaId),
    );
    return r.error;
  }

  async editarCupo(cupo: CupoDiario, base: number, minimo: number): Promise<string | null> {
    const r = await this.mutar(
      this.http.put<CupoDiario>(`${BASE}/cupos/${cupo.id}`, { base, minimo }),
      () => this.cargarCupos(cupo.areaId),
    );
    return r.error;
  }

  async eliminarCupo(cupo: CupoDiario): Promise<string | null> {
    const r = await this.mutar(
      this.http.delete<void>(`${BASE}/cupos/${cupo.id}`),
      () => this.cargarCupos(cupo.areaId),
    );
    return r.error;
  }

  // ---------------------------------------------------------------- preferencias de las tarjetas

  /** Guarda el orden y las tarjetas minimizadas del usuario en sesión (en este navegador). */
  guardarPreferencias(prefs: PreferenciasTarjetas) {
    this.preferencias.set(prefs);
    try {
      localStorage.setItem(clavePreferencias(), JSON.stringify(prefs));
    } catch {
      // Sin almacenamiento disponible: las preferencias duran solo esta visita.
    }
  }

  private cargarPreferencias(clave: string) {
    let prefs: Partial<PreferenciasTarjetas> = {};
    try {
      prefs = JSON.parse(localStorage.getItem(clave) ?? '{}') ?? {};
    } catch {
      prefs = {};
    }
    this.preferencias.set({
      orden: Array.isArray(prefs.orden) ? prefs.orden : [],
      minimizadas: Array.isArray(prefs.minimizadas) ? prefs.minimizadas : [],
    });
  }

  // ---------------------------------------------------------------- partidas

  async agregarPartida(p: PartidaNueva): Promise<string | null> {
    const r = await this.mutar(
      this.http.post<unknown>(`${BASE}/partidas`, {
        ...p,
        comentario: p.comentario.trim() || null,
        rotoPor: p.concepto === 'CAMBIO_ROTO' ? p.rotoPor : null,
      }),
      () => this.refrescarPartidas(p.areaId),
    );
    return r.error;
  }

  /** Solo sin firmar. Para la API un campo null es «sin cambio»; la ruta se quita con `quitarRuta`. */
  async editarPartida(partida: PartidaInventario, cambios: CambiosPartida): Promise<string | null> {
    const { rutaId, ...resto } = cambios;
    const cuerpo: Record<string, unknown> = { ...resto };
    if (rutaId) cuerpo['rutaId'] = rutaId;
    else if (rutaId === null && partida.rutaId) cuerpo['quitarRuta'] = true;
    const r = await this.mutar(
      this.http.put<unknown>(`${BASE}/partidas/${partida.id}`, cuerpo),
      () => this.refrescarPartidas(partida.areaId),
    );
    return r.error;
  }

  async firmarPartida(id: string, firma: Blob): Promise<string | null> {
    const cuerpo = new FormData();
    cuerpo.append('archivo', firma, 'firma.png');
    const r = await this.mutar(this.http.post<unknown>(`${BASE}/partidas/${id}/firma`, cuerpo), () =>
      this.filtroPartidas ? this.refrescarPartidas(this.filtroPartidas.areaId) : Promise.resolve(),
    );
    return r.error;
  }

  /** Solo sin firmar; la cantidad regresa al cupo y al almacén. */
  async eliminarPartidas(areaId: string, ids: string[]): Promise<{ error: string | null; eliminadas: number }> {
    const { error, dato } = await this.mutar(
      this.http.request<{ eliminadas: number }>('DELETE', `${BASE}/partidas`, { body: { ids } }),
      () => this.refrescarPartidas(areaId),
    );
    return { error, eliminadas: dato?.eliminadas ?? 0 };
  }

  private recargarPartidas(): Promise<void> {
    return this.filtroPartidas ? this.cargarPartidas(this.filtroPartidas) : Promise.resolve();
  }

  private refrescarPartidas(areaId: string) {
    return Promise.all([this.cargarCupos(areaId), this.recargarPartidas(), this.cargarPendientes(areaId)]);
  }

  // ---------------------------------------------------------------- solicitudes

  /** Notifica al responsable del almacén. */
  async solicitar(areaId: string, insumoId: string, cantidad: number, nota = ''): Promise<string | null> {
    const r = await this.mutar(
      this.http.post<unknown>(`${BASE}/solicitudes`, { areaId, insumoId, cantidad, nota: nota.trim() || null }),
      () => this.refrescarSolicitudes(areaId),
    );
    return r.error;
  }

  /** En «Solicitado» se edita la cantidad y la nota; en «Aceptado», la cantidad recibida. */
  async editarSolicitud(s: SolicitudStock, cambios: { cantidadSolicitada?: number; nota?: string; cantidadRecibida?: number }): Promise<string | null> {
    const r = await this.mutar(
      this.http.put<unknown>(`${BASE}/solicitudes/${s.id}`, cambios),
      () => this.refrescarSolicitudes(s.areaId),
    );
    return r.error;
  }

  cancelarSolicitud(s: SolicitudStock): Promise<string | null> {
    return this.responder(s, 'cancelar', {});
  }

  /**
   * El solicitante rechaza lo que le entregaron (solo en «Aceptado», antes de firmar): no se suma al cupo,
   * el insumo se queda en el almacén y se puede volver a solicitar.
   */
  declinarSolicitud(s: SolicitudStock, motivo: string): Promise<string | null> {
    return this.responder(s, 'declinar', { motivo: motivo.trim() || null });
  }

  aceptarSolicitud(s: SolicitudStock, cantidadAEntregar: number, comentario: string): Promise<string | null> {
    return this.responder(s, 'aceptar', { cantidadAEntregar, comentario: comentario || null });
  }

  rechazarSolicitud(s: SolicitudStock, comentario: string): Promise<string | null> {
    return this.responder(s, 'rechazar', { comentario });
  }

  /** Recibe con firma: amplía el cupo del día. */
  recibirSolicitud(s: SolicitudStock, cantidadRecibida: number, firma: Blob): Promise<string | null> {
    const cuerpo = new FormData();
    cuerpo.append('cantidadRecibida', String(cantidadRecibida));
    cuerpo.append('archivo', firma, 'firma.png');
    return this.responder(s, 'recibir', cuerpo);
  }

  private async responder(s: SolicitudStock, accion: 'cancelar' | 'aceptar' | 'rechazar' | 'recibir' | 'declinar', cuerpo: unknown): Promise<string | null> {
    // El almacén atiende solicitudes sin tener el área abierta: ahí no hacen falta los cupos.
    const conCupos = accion === 'cancelar' || accion === 'recibir' || accion === 'declinar';
    const r = await this.mutar(
      this.http.put<unknown>(`${BASE}/solicitudes/${s.id}/${accion}`, cuerpo),
      () => (conCupos ? this.refrescarSolicitudes(s.areaId) : this.recargarSolicitudes()),
    );
    return r.error;
  }

  /** Llegó un aviso de solicitud de stock: se refrescan las solicitudes y, si hay área abierta, sus tarjetas. */
  actualizarPorAviso(areaId: string | null): Promise<unknown> {
    return Promise.all([areaId ? this.cargarCupos(areaId) : Promise.resolve(), this.recargarSolicitudes()]);
  }

  private recargarSolicitudes(): Promise<void> {
    return this.filtroSolicitudes ? this.cargarSolicitudes(this.filtroSolicitudes) : Promise.resolve();
  }

  private refrescarSolicitudes(areaId: string) {
    return Promise.all([this.cargarCupos(areaId), this.recargarSolicitudes()]);
  }

  // ---------------------------------------------------------------- internos

  /** Lectura: si falla, el aviso general ya mostró el error y se conserva lo que había. */
  private async leer<T>(peticion: Observable<T>): Promise<T | undefined> {
    try {
      return await firstValueFrom(peticion);
    } catch {
      return undefined;
    }
  }

  private async mutar<T>(peticion: Observable<T>, refrescar: (dato: T) => Promise<unknown>): Promise<{ error: string | null; dato: T | null }> {
    let dato: T;
    try {
      dato = await firstValueFrom(peticion);
    } catch (e) {
      return { error: this.mensajeDe(e), dato: null };
    }
    await refrescar(dato);
    return { error: null, dato };
  }

  /** Mensaje para el usuario: viene en `message` del cuerpo del error. */
  private mensajeDe(e: unknown): string {
    if (!(e instanceof HttpErrorResponse)) return 'No se pudo completar la acción.';
    // Endpoint que el servidor aún no tiene (acciones nuevas pedidas en el Buzón).
    if ((e.status === 404 || e.status === 405) && /\/declinar$/.test(e.url ?? '')) {
      if (this.dialogError.dataError() === e) this.dialogError.display.set(false);
      return 'Esta acción aún no está habilitada en el servidor.';
    }
    const mensaje = typeof e.error?.message === 'string' ? e.error.message.trim() : '';
    if (!mensaje) return e.status === 0 ? 'No se pudo conectar con el servidor.' : 'No se pudo completar la acción.';
    // Las reglas de negocio las muestra la pantalla: se cierra el aviso general para no repetirlas.
    if (e.status >= 400 && e.status < 500 && this.dialogError.dataError() === e) this.dialogError.display.set(false);
    return mensaje;
  }

  private tomarTurno(tipo: string): () => boolean {
    const n = (this.turnos[tipo] = (this.turnos[tipo] ?? 0) + 1);
    return () => this.turnos[tipo] === n;
  }
}

/** Parámetros de consulta: solo los que tienen valor; fechas como AAAA-MM-DD. */
function parametros(filtro: FiltroSolicitudes | FiltroPartidas): Record<string, string> {
  const params: Record<string, string> = {};
  for (const [clave, valor] of Object.entries(filtro) as [string, string | Date | null | undefined][]) {
    if (valor) params[clave] = valor instanceof Date ? ymd(valor) : valor;
  }
  return params;
}

function aFecha(v: string | null): Date | null {
  return v ? new Date(v) : null;
}

function aPartida(p: Json<PartidaInventario>): PartidaInventario {
  return { ...p, comentario: p.comentario ?? '', fecha: new Date(p.fecha), fechaFirma: aFecha(p.fechaFirma) };
}

function aSolicitud(s: Json<SolicitudStock>): SolicitudStock {
  return {
    ...s,
    nota: s.nota ?? '',
    comentario: s.comentario ?? '',
    fechaSolicitud: new Date(s.fechaSolicitud),
    fechaConfirmacion: aFecha(s.fechaConfirmacion),
    fechaRecepcion: aFecha(s.fechaRecepcion),
    fechaFirmaAlmacen: aFecha((s.fechaFirmaAlmacen as unknown as string | null | undefined) ?? null),
  };
}

/** Clave de localStorage del orden y las tarjetas minimizadas del usuario en sesión. */
function clavePreferencias(): string {
  let usuario = 'anonimo';
  try {
    const info = JSON.parse(localStorage.getItem('userInfo') ?? 'null');
    usuario = info?.idEmpleado || info?.nombreUsuario || usuario;
  } catch {
    // userInfo ausente o ilegible: se usa la clave genérica.
  }
  return `tancol:inventario-diario:tarjetas:${usuario}:preferencias`;
}

/** Fecha local → AAAA-MM-DD. */
export function ymd(d: Date): string {
  return d.toLocaleDateString('en-CA');
}

/** Día de hoy en México (AAAA-MM-DD). */
export function hoyMexico(): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'America/Mexico_City' });
}

/** Ícono (Font Awesome) de la tarjeta según el nombre del insumo. */
export function iconoInsumo(nombre: string): string {
  const n = nombre.toLowerCase();
  if (n.includes('bolsa') || n.includes('hielo')) return 'fa-cube';
  if (n.includes('tapa')) return 'fa-circle-dot';
  if (n.includes('sello')) return 'fa-tag';
  if (n.includes('envase') || n.includes('garraf')) return 'fa-bottle-water';
  return 'fa-box';
}
