import { Injectable, computed, signal } from '@angular/core';
import {
  AlmacenInventario,
  AreaInventario,
  ConceptoEntrega,
  ConfirmacionDia,
  CupoDiario,
  EmpleadoInventario,
  InsumoInventario,
  PartidaInventario,
  PreferenciasTarjetas,
  ROTO_POR_MAQUINA,
  RutaInventario,
  SolicitudStock,
} from './inventario-diario.models';

/**
 * Inventario diario de insumos — ETAPA DE DISEÑO.
 *
 * Todo vive en memoria con datos de ejemplo. Cada método público corresponde a una operación
 * que el backend implementará en la segunda etapa (los comentarios «API:» sugieren el endpoint);
 * al conectar, se reemplaza el cuerpo de cada método sin tocar las pantallas.
 */
@Injectable({ providedIn: 'root' })
export class InventarioDiarioService {
  // ---- Permisos (en diseño, el usuario en sesión tiene ambos) ----
  /** Permiso «Responsable de área»: confirma el cupo al iniciar el día. */
  readonly esResponsableArea = signal(true);
  /** Permiso «Responsable de almacén»: acepta o rechaza solicitudes de stock. */
  readonly esResponsableAlmacen = signal(true);

  // ---- Catálogos (API: departamentos, empleados, rutas, inventario inicial) ----
  readonly areas: AreaInventario[] = [
    { id: 'a-prod', nombre: 'Producción', almacenId: 'alm-planta', almacenNombre: 'Almacén Planta' },
    { id: 'a-auto', nombre: 'Autoservicio', almacenId: 'alm-auto', almacenNombre: 'Almacén Autoservicio' },
    { id: 'a-dist', nombre: 'Distribución', almacenId: 'alm-planta', almacenNombre: 'Almacén Planta' },
  ];

  readonly almacenes: AlmacenInventario[] = [
    { id: 'alm-planta', nombre: 'Almacén Planta' },
    { id: 'alm-auto', nombre: 'Almacén Autoservicio' },
    { id: 'alm-hielo', nombre: 'Cámara fría' },
  ];

  readonly insumos: InsumoInventario[] = [
    { id: 'i-env20', nombre: 'Envase 20 L', unidad: 'piezas', icono: 'fa-bottle-water' },
    { id: 'i-env11', nombre: 'Envase 11 L', unidad: 'piezas', icono: 'fa-bottle-water' },
    { id: 'i-bol3', nombre: 'Bolsa de hielo 3 kg', unidad: 'bolsas', icono: 'fa-cube' },
    { id: 'i-bol5', nombre: 'Bolsa de hielo 5 kg', unidad: 'bolsas', icono: 'fa-cube' },
    { id: 'i-tapa', nombre: 'Tapa para garrafón', unidad: 'piezas', icono: 'fa-circle-dot' },
    { id: 'i-sello', nombre: 'Sello de seguridad', unidad: 'piezas', icono: 'fa-tag' },
    { id: 'i-bol10', nombre: 'Bolsa de hielo 10 kg', unidad: 'bolsas', icono: 'fa-cube' },
  ];

  readonly empleados: EmpleadoInventario[] = [
    { id: 'e-1', nombre: 'Luis Armando Tudón Cedillo' },
    { id: 'e-2', nombre: 'Tomás Manuel Gallegos Sánchez' },
    { id: 'e-3', nombre: 'Gerardo Flores Hernández' },
    { id: 'e-4', nombre: 'Julio César Ramírez González' },
    { id: 'e-5', nombre: 'Josué Aarón Meza Meza' },
    { id: 'e-6', nombre: 'Mario de Jesús Mendoza Chablet' },
  ];

  readonly rutas: RutaInventario[] = [
    { id: 'r-01', nombre: 'RP-01' },
    { id: 'r-05', nombre: 'RP-05' },
    { id: 'r-11', nombre: 'RP-11' },
    { id: 'r-14', nombre: 'RC-14' },
    { id: 'r-18', nombre: 'RC-18' },
  ];

  /**
   * Existencia por almacén e insumo (Inventario inicial). Clave: `${almacenId}|${insumoId}`.
   * Un insumo solo está en los almacenes donde tiene registro (API: inventario inicial por almacén).
   */
  private readonly existencias = signal<Record<string, number>>({
    'alm-planta|i-env20': 480, 'alm-planta|i-env11': 310, 'alm-planta|i-bol3': 5200, 'alm-planta|i-bol5': 450,
    'alm-planta|i-tapa': 900, 'alm-planta|i-sello': 1500,
    'alm-auto|i-env20': 12, 'alm-auto|i-env11': 140, 'alm-auto|i-bol3': 2300, 'alm-auto|i-bol5': 1900,
    'alm-auto|i-tapa': 300, 'alm-auto|i-sello': 400,
    'alm-hielo|i-bol3': 3800, 'alm-hielo|i-bol5': 2600, 'alm-hielo|i-bol10': 900,
  });

  /** Orden y tarjetas minimizadas del usuario en sesión. */
  readonly preferencias = signal<PreferenciasTarjetas>({ orden: [], minimizadas: [] });

  readonly cupos = signal<CupoDiario[]>([]);
  readonly partidas = signal<PartidaInventario[]>([]);
  readonly solicitudes = signal<SolicitudStock[]>([]);
  readonly confirmaciones = signal<ConfirmacionDia[]>([]);

  private folioPartida = 0;
  /** Usuario cuyas tarjetas propias están cargadas. */
  private claveCargada: string | null = null;
  private folioSolicitud = 0;

  readonly pendientesConfirmacion = computed(() => this.solicitudes().filter((s) => s.estatus === 'SOLICITADO').length);

  constructor() {
    this.sembrar();
  }

  // ---------------------------------------------------------------- consultas

  usuarioActual(): string {
    try {
      const info = JSON.parse(localStorage.getItem('userInfo') ?? 'null');
      const nombre = [info?.nombre, info?.apellidoPaterno].filter(Boolean).join(' ').trim();
      return nombre || info?.nombreUsuario || 'Usuario en sesión';
    } catch {
      return 'Usuario en sesión';
    }
  }

  area(id: string | null | undefined) { return this.areas.find((a) => a.id === id); }
  almacen(id: string | null | undefined) { return this.almacenes.find((a) => a.id === id); }
  insumo(id: string | null | undefined) { return this.insumos.find((i) => i.id === id); }
  ruta(id: string | null | undefined) { return this.rutas.find((r) => r.id === id); }
  empleado(id: string | null | undefined) { return this.empleados.find((e) => e.id === id); }

  nombreRotoPor(id: string | null): string {
    if (!id) return '—';
    return id === ROTO_POR_MAQUINA ? 'Máquina' : this.empleado(id)?.nombre ?? '—';
  }

  /** Existencia del insumo en el almacén de la tarjeta del área (o el almacén del área si no hay tarjeta). */
  existencia(areaId: string, insumoId: string): number {
    const almacenId = this.cupo(areaId, insumoId)?.almacenId ?? this.area(areaId)?.almacenId;
    return almacenId ? this.existenciaEn(almacenId, insumoId) : 0;
  }

  existenciaEn(almacenId: string, insumoId: string): number {
    return this.existencias()[`${almacenId}|${insumoId}`] ?? 0;
  }

  /** Insumos registrados en el inventario del almacén. */
  insumosDeAlmacen(almacenId: string | null | undefined): InsumoInventario[] {
    if (!almacenId) return [];
    const e = this.existencias();
    return this.insumos.filter((i) => `${almacenId}|${i.id}` in e);
  }

  disponible(c: CupoDiario): number {
    return c.inicial + c.ampliado - c.consumido;
  }

  cuposDeArea(areaId: string): CupoDiario[] {
    return this.cupos().filter((c) => c.areaId === areaId);
  }

  cupo(areaId: string, insumoId: string): CupoDiario | undefined {
    return this.cupos().find((c) => c.areaId === areaId && c.insumoId === insumoId);
  }

  /** Solicitud aún en curso (Solicitado o Aceptado) del insumo en el área: bloquea pedir otra. */
  solicitudAbierta(areaId: string, insumoId: string): SolicitudStock | undefined {
    return this.solicitudes().find(
      (s) => s.areaId === areaId && s.insumoId === insumoId && (s.estatus === 'SOLICITADO' || s.estatus === 'ACEPTADO'),
    );
  }

  cupoConfirmado(areaId: string, fecha = new Date()): ConfirmacionDia | undefined {
    const dia = ymd(fecha);
    return this.confirmaciones().find((c) => c.areaId === areaId && c.fecha === dia);
  }

  /** Lo que se entregará al confirmar el día: la base o lo que alcance en el almacén. */
  previaInicioDia(areaId: string) {
    return this.cuposDeArea(areaId).map((c) => {
      const existencia = this.existencia(areaId, c.insumoId);
      const inicial = Math.min(c.base, existencia);
      return { cupo: c, insumo: this.insumo(c.insumoId)!, existencia, inicial, faltante: c.base - inicial };
    });
  }

  // ---------------------------------------------------------------- cupos

  /** API: POST inventario-diario/confirmaciones { areaId } */
  confirmarCupoDia(areaId: string): { insumo: string; faltante: number }[] {
    const previa = this.previaInicioDia(areaId);
    this.cupos.update((cs) =>
      cs.map((c) => {
        if (c.areaId !== areaId) return c;
        const p = previa.find((x) => x.cupo.id === c.id)!;
        return { ...c, inicial: p.inicial, ampliado: 0, consumido: 0 };
      }),
    );
    this.confirmaciones.update((cs) => [
      ...cs,
      { areaId, fecha: ymd(new Date()), confirmadoPor: this.usuarioActual(), confirmadoEn: new Date() },
    ]);
    return previa.filter((p) => p.faltante > 0).map((p) => ({ insumo: p.insumo.nombre, faltante: p.faltante }));
  }

  /** API: POST inventario-diario/cupos — tarjeta agregada por el usuario (sí se puede eliminar). */
  agregarCupo(areaId: string, almacenId: string, insumoId: string, base: number, minimo: number) {
    const inicial = this.cupoConfirmado(areaId) ? Math.min(base, this.existenciaEn(almacenId, insumoId)) : 0;
    this.cupos.update((cs) => [
      ...cs,
      { id: uid('c'), areaId, insumoId, almacenId, porDefecto: false, base, minimo, inicial, ampliado: 0, consumido: 0 },
    ]);
    this.guardarTarjetasUsuario();
  }

  /** API: PUT inventario-diario/cupos/:id — la nueva base aplica desde hoy si alcanza el almacén. */
  editarCupo(id: string, base: number, minimo: number) {
    this.cupos.update((cs) =>
      cs.map((c) => {
        if (c.id !== id) return c;
        const tope = this.existencia(c.areaId, c.insumoId) + c.consumido;
        return { ...c, base, minimo, inicial: this.cupoConfirmado(c.areaId) ? Math.min(base, tope) : c.inicial };
      }),
    );
    this.guardarTarjetasUsuario();
  }

  /** API: DELETE inventario-diario/cupos/:id — las tarjetas por defecto no se eliminan. */
  eliminarCupo(id: string) {
    this.cupos.update((cs) => cs.filter((c) => c.id !== id || c.porDefecto));
    this.guardarTarjetasUsuario();
  }

  // ---------------------------------------------------------------- tarjetas por usuario

  /**
   * Las tarjetas que agrega cada usuario se guardan en este navegador, por usuario en sesión;
   * las 4 por defecto siempre están. API (2.ª etapa): GET/PUT inventario-diario/tarjetas.
   */
  cargarTarjetasUsuario() {
    const clave = claveTarjetas();
    if (clave === this.claveCargada) return;
    this.claveCargada = clave;
    let guardadas: TarjetaGuardada[] = [];
    try {
      guardadas = JSON.parse(localStorage.getItem(clave) ?? '[]');
    } catch {
      guardadas = [];
    }
    const confirmadas = new Set(this.confirmaciones().filter((c) => c.fecha === ymd(new Date())).map((c) => c.areaId));
    const propias = (Array.isArray(guardadas) ? guardadas : [])
      .filter((g) => this.area(g.areaId) && this.almacen(g.almacenId) && this.insumo(g.insumoId))
      .map<CupoDiario>((g) => ({
        id: uid('c'), areaId: g.areaId, insumoId: g.insumoId, almacenId: g.almacenId, porDefecto: false,
        base: g.base, minimo: g.minimo,
        inicial: confirmadas.has(g.areaId) ? Math.min(g.base, this.existenciaEn(g.almacenId, g.insumoId)) : 0,
        ampliado: 0, consumido: 0,
      }));
    this.cupos.update((cs) => [...cs.filter((c) => c.porDefecto), ...propias]);
    let prefs: Partial<PreferenciasTarjetas> = {};
    try {
      prefs = JSON.parse(localStorage.getItem(`${clave}:preferencias`) ?? '{}') ?? {};
    } catch {
      prefs = {};
    }
    this.preferencias.set({
      orden: Array.isArray(prefs.orden) ? prefs.orden : [],
      minimizadas: Array.isArray(prefs.minimizadas) ? prefs.minimizadas : [],
    });
  }

  /** Guarda el orden y las tarjetas minimizadas del usuario en sesión. */
  guardarPreferencias(prefs: PreferenciasTarjetas) {
    this.preferencias.set(prefs);
    try {
      localStorage.setItem(`${claveTarjetas()}:preferencias`, JSON.stringify(prefs));
    } catch {
      // Sin almacenamiento disponible: las preferencias duran solo esta visita.
    }
  }

  private guardarTarjetasUsuario() {
    const propias: TarjetaGuardada[] = this.cupos()
      .filter((c) => !c.porDefecto)
      .map(({ areaId, almacenId, insumoId, base, minimo }) => ({ areaId, almacenId, insumoId, base, minimo }));
    try {
      localStorage.setItem(claveTarjetas(), JSON.stringify(propias));
    } catch {
      // Sin almacenamiento disponible: las tarjetas duran solo esta visita.
    }
  }

  // ---------------------------------------------------------------- partidas

  /**
   * API: POST inventario-diario/partidas — descuenta del cupo y del almacén del área.
   * Devuelve un mensaje de error si no procede.
   */
  agregarPartida(p: {
    areaId: string; rutaId: string | null; insumoId: string; cantidad: number;
    concepto: ConceptoEntrega; comentario: string; rotoPor: string | null;
  }): string | null {
    const cupo = this.cupo(p.areaId, p.insumoId);
    if (!cupo) return 'El área no tiene cupo para este insumo.';
    if (!this.cupoConfirmado(p.areaId)) return 'Primero confirma el cupo del día.';
    if (p.cantidad <= 0) return 'La cantidad debe ser mayor a cero.';
    if (p.cantidad > this.disponible(cupo)) return `Supera el cupo disponible (${this.disponible(cupo)}).`;
    const usuario = this.usuarioActual();
    const rotoPorEmpleado = p.concepto === 'CAMBIO_ROTO' && p.rotoPor && p.rotoPor !== ROTO_POR_MAQUINA;
    const partida: PartidaInventario = {
      id: uid('p'), folio: this.siguienteFolioPartida(), fecha: new Date(), ...p,
      rotoPor: p.concepto === 'CAMBIO_ROTO' ? p.rotoPor : null,
      usuario,
      firmante: rotoPorEmpleado ? this.empleado(p.rotoPor)!.nombre : usuario,
      firma: null, fechaFirma: null,
    };
    this.partidas.update((ps) => [partida, ...ps]);
    this.moverCupo(p.areaId, p.insumoId, p.cantidad);
    return null;
  }

  /**
   * API: PUT inventario-diario/partidas/:id — solo sin firmar. Si cambia insumo o cantidad,
   * se regresa lo anterior al cupo/almacén y se descuenta lo nuevo. Devuelve error si no procede.
   */
  editarPartida(id: string, cambios: Partial<Pick<PartidaInventario, 'rutaId' | 'insumoId' | 'cantidad' | 'concepto' | 'comentario' | 'rotoPor'>>): string | null {
    const actual = this.partidas().find((p) => p.id === id);
    if (!actual) return 'La partida ya no existe.';
    if (actual.firma) return 'La partida ya está firmada.';
    const nueva = { ...actual, ...cambios };
    if (nueva.concepto !== 'CAMBIO_ROTO') nueva.rotoPor = null;
    if (!nueva.cantidad || nueva.cantidad <= 0) return 'La cantidad debe ser mayor a cero.';
    const cupo = this.cupo(nueva.areaId, nueva.insumoId);
    if (!cupo) return 'El área no tiene cupo para este insumo.';
    const libre = this.disponible(cupo) + (nueva.insumoId === actual.insumoId ? actual.cantidad : 0);
    if (nueva.cantidad > libre) return `Supera el cupo disponible (${libre}).`;
    this.moverCupo(actual.areaId, actual.insumoId, -actual.cantidad);
    this.moverCupo(nueva.areaId, nueva.insumoId, nueva.cantidad);
    const rotoPorEmpleado = nueva.concepto === 'CAMBIO_ROTO' && nueva.rotoPor && nueva.rotoPor !== ROTO_POR_MAQUINA;
    nueva.firmante = rotoPorEmpleado ? this.empleado(nueva.rotoPor)!.nombre : nueva.usuario;
    this.partidas.update((ps) => ps.map((p) => (p.id === id ? nueva : p)));
    return null;
  }

  /** API: POST inventario-diario/partidas/:id/firma */
  firmarPartida(id: string, firma: string) {
    this.partidas.update((ps) => ps.map((p) => (p.id === id ? { ...p, firma, fechaFirma: new Date() } : p)));
  }

  /** API: DELETE inventario-diario/partidas — solo sin firmar; la cantidad regresa al cupo y al almacén. */
  eliminarPartidas(ids: string[]): number {
    const borrables = this.partidas().filter((p) => ids.includes(p.id) && !p.firma);
    borrables.forEach((p) => this.moverCupo(p.areaId, p.insumoId, -p.cantidad));
    const set = new Set(borrables.map((p) => p.id));
    this.partidas.update((ps) => ps.filter((p) => !set.has(p.id)));
    return borrables.length;
  }

  // ---------------------------------------------------------------- solicitudes

  /** API: POST inventario-diario/solicitudes — notifica al responsable de almacén. */
  solicitar(areaId: string, insumoId: string, cantidad: number, nota = ''): string | null {
    if (cantidad <= 0) return 'La cantidad debe ser mayor a cero.';
    if (this.solicitudAbierta(areaId, insumoId)) return 'Ya hay una solicitud en curso para este insumo.';
    const motivo = this.motivoNoSolicitar(areaId, insumoId);
    if (motivo) return motivo;
    this.solicitudes.update((ss) => [
      {
        id: uid('s'), folio: this.siguienteFolioSolicitud(), areaId, insumoId, cantidadSolicitada: cantidad,
        cantidadAEntregar: null, cantidadRecibida: null, nota: nota.trim(), solicitadoPor: this.usuarioActual(), fechaSolicitud: new Date(),
        estatus: 'SOLICITADO', confirmadoPor: null, fechaConfirmacion: null, comentario: '', fechaRecepcion: null, recibidoPor: null, firma: null,
      },
      ...ss,
    ]);
    return null;
  }

  /** Por qué no se puede pedir stock de un insumo hoy (vacío si sí se puede). Misma regla que la tarjeta. */
  motivoNoSolicitar(areaId: string, insumoId: string): string {
    const cupo = this.cupo(areaId, insumoId);
    if (!cupo) return 'El área no tiene tarjeta de este insumo.';
    if (!this.cupoConfirmado(areaId)) return 'Confirma primero el cupo del día.';
    const abierta = this.solicitudAbierta(areaId, insumoId);
    if (abierta) return `Ya hay una solicitud en curso (${abierta.folio}).`;
    if (this.disponible(cupo) > cupo.minimo) return `Se habilita al llegar a ${cupo.minimo} o menos.`;
    return '';
  }

  /**
   * API: PUT inventario-diario/solicitudes/:id — mientras no esté firmada:
   * en «Solicitado» se edita la cantidad y la nota; en «Aceptado», la cantidad recibida.
   */
  editarSolicitud(id: string, cambios: { cantidadSolicitada?: number; nota?: string; cantidadRecibida?: number | null }): string | null {
    const s = this.solicitudes().find((x) => x.id === id);
    if (!s) return 'La solicitud ya no existe.';
    if (s.firma) return 'La solicitud ya está firmada.';
    if (s.estatus === 'SOLICITADO') {
      if (cambios.cantidadSolicitada !== undefined && cambios.cantidadSolicitada < 1) return 'La cantidad debe ser mayor a cero.';
      this.actualizarSolicitud(id, (x) => ({
        ...x,
        cantidadSolicitada: cambios.cantidadSolicitada ?? x.cantidadSolicitada,
        nota: cambios.nota !== undefined ? cambios.nota.trim() : x.nota,
      }));
      return null;
    }
    if (s.estatus === 'ACEPTADO' && cambios.cantidadRecibida !== undefined) {
      const c = cambios.cantidadRecibida;
      if (c !== null && (c < 1 || c > (s.cantidadAEntregar ?? Infinity))) return `La cantidad recibida debe ser de 1 a ${s.cantidadAEntregar}.`;
      this.actualizarSolicitud(id, (x) => ({ ...x, cantidadRecibida: c }));
      return null;
    }
    return 'En este estatus la solicitud ya no se puede editar.';
  }

  /** API: PUT inventario-diario/solicitudes/:id/cancelar (solo en Solicitado) */
  cancelarSolicitud(id: string) {
    this.actualizarSolicitud(id, (s) => (s.estatus === 'SOLICITADO' ? { ...s, estatus: 'CANCELADO' } : s));
  }

  /** API: PUT inventario-diario/solicitudes/:id/aceptar { cantidadAEntregar, comentario } */
  aceptarSolicitud(id: string, cantidadAEntregar: number, comentario: string) {
    this.actualizarSolicitud(id, (s) => ({
      ...s, estatus: 'ACEPTADO', cantidadAEntregar, comentario,
      confirmadoPor: this.usuarioActual(), fechaConfirmacion: new Date(),
    }));
  }

  /** API: PUT inventario-diario/solicitudes/:id/rechazar { comentario } */
  rechazarSolicitud(id: string, comentario: string) {
    this.actualizarSolicitud(id, (s) => ({
      ...s, estatus: 'RECHAZADO', comentario, confirmadoPor: this.usuarioActual(), fechaConfirmacion: new Date(),
    }));
  }

  /** API: PUT inventario-diario/solicitudes/:id/recibir { cantidadRecibida, firma } — amplía el cupo del día. */
  recibirSolicitud(id: string, cantidadRecibida: number, firma: string) {
    const s = this.solicitudes().find((x) => x.id === id);
    if (!s || s.estatus !== 'ACEPTADO') return;
    this.actualizarSolicitud(id, (x) => ({
      ...x, estatus: 'RECIBIDO', cantidadRecibida, firma, fechaRecepcion: new Date(), recibidoPor: this.usuarioActual(),
    }));
    this.cupos.update((cs) =>
      cs.map((c) => (c.areaId === s.areaId && c.insumoId === s.insumoId ? { ...c, ampliado: c.ampliado + cantidadRecibida } : c)),
    );
  }

  // ---------------------------------------------------------------- internos

  private moverCupo(areaId: string, insumoId: string, cantidad: number) {
    this.cupos.update((cs) =>
      cs.map((c) => (c.areaId === areaId && c.insumoId === insumoId ? { ...c, consumido: c.consumido + cantidad } : c)),
    );
    const almacenId = this.cupo(areaId, insumoId)?.almacenId ?? this.area(areaId)!.almacenId;
    const clave = `${almacenId}|${insumoId}`;
    this.existencias.update((e) => ({ ...e, [clave]: (e[clave] ?? 0) - cantidad }));
  }

  private actualizarSolicitud(id: string, fn: (s: SolicitudStock) => SolicitudStock) {
    this.solicitudes.update((ss) => ss.map((s) => (s.id === id ? fn(s) : s)));
  }

  private siguienteFolioPartida() {
    return `IDI-${String(++this.folioPartida).padStart(5, '0')}`;
  }

  private siguienteFolioSolicitud() {
    return `SDS-${String(++this.folioSolicitud).padStart(5, '0')}`;
  }

  /** Datos de ejemplo: Producción con el día confirmado y movimientos; Autoservicio pendiente de confirmar. */
  private sembrar() {
    const hoy = new Date();
    const hace = (dias: number, h: number, m = 0) => new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() - dias, h, m);
    const base = (areaId: string) => [
      { insumoId: 'i-env20', base: 25, minimo: 5 },
      { insumoId: 'i-env11', base: 25, minimo: 5 },
      { insumoId: 'i-bol3', base: 700, minimo: 5 },
      { insumoId: 'i-bol5', base: 700, minimo: 5 },
    ].map((x) => ({
      id: uid('c'), areaId, almacenId: this.area(areaId)!.almacenId, porDefecto: true, ...x, inicial: 0, ampliado: 0, consumido: 0,
    }));
    this.cupos.set([...base('a-prod'), ...base('a-auto'), ...base('a-dist')]);

    // Producción: día confirmado. Bolsa 5 kg queda incompleta (almacén con 450).
    this.confirmaciones.set([{ areaId: 'a-prod', fecha: ymd(hoy), confirmadoPor: 'Gerardo Flores Hernández', confirmadoEn: hace(0, 7, 5) }]);
    this.cupos.update((cs) => cs.map((c) => (c.areaId === 'a-prod' ? { ...c, inicial: Math.min(c.base, this.existencia('a-prod', c.insumoId) + 0) } : c)));

    const usuario = 'Gerardo Flores Hernández';
    const p = (dias: number, h: number, rutaId: string | null, insumoId: string, cantidad: number, concepto: ConceptoEntrega,
      rotoPor: string | null = null, firmada = true, comentario = ''): PartidaInventario => {
      const firmante = rotoPor && rotoPor !== ROTO_POR_MAQUINA ? this.empleado(rotoPor)!.nombre : usuario;
      return {
        id: uid('p'), folio: this.siguienteFolioPartida(), fecha: hace(dias, h), areaId: 'a-prod', rutaId, insumoId, cantidad,
        concepto, comentario, rotoPor, usuario, firmante,
        firma: firmada ? FIRMA_EJEMPLO : null, fechaFirma: firmada ? hace(dias, h, 10) : null,
      };
    };
    const ayer = [
      p(1, 8, 'r-01', 'i-env20', 18, 'VENTA'),
      p(1, 11, 'r-05', 'i-bol3', 240, 'VENTA'),
      p(1, 15, null, 'i-env11', 2, 'CAMBIO_ROTO', ROTO_POR_MAQUINA, true, 'Se rompió en la llenadora'),
    ];
    const hoyPartidas = [
      p(0, 8, 'r-11', 'i-env20', 12, 'VENTA'),
      p(0, 9, 'r-14', 'i-env20', 4, 'CAMBIO'),
      p(0, 10, 'r-18', 'i-env20', 2, 'CAMBIO_ROTO', 'e-2', false, 'Garrafón estrellado al descargar'),
      p(0, 11, null, 'i-env20', 1, 'DONADO', null, true, 'Donativo a escuela'),
      p(0, 12, 'r-01', 'i-env20', 1, 'HUECO', null, false),
      p(0, 9, 'r-05', 'i-env11', 3, 'VENTA'),
      p(0, 10, 'r-11', 'i-bol3', 120, 'VENTA'),
      p(0, 13, 'r-14', 'i-bol5', 80, 'VENTA', null, false),
    ];
    this.partidas.set([...hoyPartidas, ...ayer].sort((a, b) => b.fecha.getTime() - a.fecha.getTime()));
    // Consumo de hoy aplicado al cupo (las existencias de ejemplo ya lo descuentan).
    this.cupos.update((cs) => cs.map((c) => ({
      ...c,
      consumido: hoyPartidas.filter((x) => x.areaId === c.areaId && x.insumoId === c.insumoId).reduce((t, x) => t + x.cantidad, 0),
    })));

    const s = (dias: number, areaId: string, insumoId: string, cant: number, estatus: SolicitudStock['estatus'],
      extra: Partial<SolicitudStock> = {}): SolicitudStock => ({
      id: uid('s'), folio: this.siguienteFolioSolicitud(), areaId, insumoId, cantidadSolicitada: cant, cantidadAEntregar: null,
      cantidadRecibida: null, nota: '', solicitadoPor: usuario, fechaSolicitud: hace(dias, 16), estatus, confirmadoPor: null,
      fechaConfirmacion: null, comentario: '', fechaRecepcion: null, recibidoPor: null, firma: null, ...extra,
    });
    this.solicitudes.set([
      s(1, 'a-prod', 'i-env20', 10, 'RECIBIDO', {
        cantidadAEntregar: 10, cantidadRecibida: 9, confirmadoPor: 'Josué Aarón Meza Meza', fechaConfirmacion: hace(1, 16, 20),
        fechaRecepcion: hace(1, 17), recibidoPor: usuario, firma: FIRMA_EJEMPLO, comentario: 'Se entregaron 9; uno venía dañado.',
        nota: 'Se acabaron por pedido especial de RP-01.',
      }),
      s(0, 'a-prod', 'i-bol3', 200, 'ACEPTADO', {
        cantidadAEntregar: 150, confirmadoPor: 'Josué Aarón Meza Meza', fechaConfirmacion: hace(0, 12, 30),
        comentario: 'Se entregan 150 por existencia en cámara fría.', fechaSolicitud: hace(0, 12),
      }),
      s(0, 'a-auto', 'i-env11', 10, 'SOLICITADO', { solicitadoPor: 'Julio César Ramírez González', fechaSolicitud: hace(0, 11) }),
    ].reverse());
    // Más recientes primero.
    this.solicitudes.update((ss) => [...ss].sort((a, b) => b.fechaSolicitud.getTime() - a.fechaSolicitud.getTime()));
  }
}

interface TarjetaGuardada {
  areaId: string;
  almacenId: string;
  insumoId: string;
  base: number;
  minimo: number;
}

/** Clave de localStorage de las tarjetas propias del usuario en sesión. */
function claveTarjetas(): string {
  let usuario = 'anonimo';
  try {
    const info = JSON.parse(localStorage.getItem('userInfo') ?? 'null');
    usuario = info?.idEmpleado || info?.nombreUsuario || usuario;
  } catch {
    // userInfo ausente o ilegible: se usa la clave genérica.
  }
  return `tancol:inventario-diario:tarjetas:${usuario}`;
}

/** Fecha local → AAAA-MM-DD. */
export function ymd(d: Date): string {
  return d.toLocaleDateString('en-CA');
}

let contador = 0;
function uid(prefijo: string) {
  return `${prefijo}-${Date.now().toString(36)}-${(++contador).toString(36)}`;
}

/** Firma de ejemplo (trazo simple en SVG) para las partidas ya firmadas del ejemplo. */
const FIRMA_EJEMPLO =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="160" height="60"><path d="M8 40 C 30 5, 40 60, 60 30 S 90 10, 100 35 S 130 50, 152 20" fill="none" stroke="#1b2740" stroke-width="2.5" stroke-linecap="round"/></svg>');
