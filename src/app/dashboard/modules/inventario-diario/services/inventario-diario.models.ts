/**
 * Modelo del Inventario diario de insumos.
 *
 * El inventario físico vive solo en el almacén asignado a cada área (Inventario inicial).
 * Cada área tiene un CUPO diario por insumo: cuánto puede consumir ese día. Cada partida
 * descuenta del cupo y del almacén. Al cierre (23:59:59) el cupo vuelve a la base; lo no usado
 * nunca salió del almacén. Solicitar stock = pedir al almacén ampliar el cupo del día.
 */

export interface AreaInventario {
  id: string;
  nombre: string;
  /** Almacén asignado al departamento; null si aún no tiene. */
  almacenId: string | null;
  almacenNombre: string | null;
}

export interface AlmacenInventario {
  id: string;
  nombre: string;
  responsableId: string | null;
  responsableNombre: string | null;
  /** Insumos con registro en el almacén (Inventario inicial). Si no llega, el front los cuenta. */
  totalInsumos?: number;
}

/** Insumo con registro en un almacén. */
export interface InsumoInventario {
  id: string;
  nombre: string;
  /** Unidad de medida seleccionada en el catálogo del insumo: «piezas», «bolsas». */
  unidad: string;
  existencia: number;
}

export interface CatalogosInventario {
  areas: AreaInventario[];
  almacenes: AlmacenInventario[];
  empleados: EmpleadoInventario[];
  rutas: RutaInventario[];
}

/** Áreas y almacenes que el usuario en sesión tiene a cargo. */
export interface MisPermisos {
  esAdmin: boolean;
  responsableArea: string[];
  responsableAlmacen: string[];
}

/** Preferencias de las tarjetas por usuario: orden y cuáles están minimizadas (clave `${areaId}|${insumoId}`). */
export interface PreferenciasTarjetas {
  orden: string[];
  minimizadas: string[];
}

export interface EmpleadoInventario {
  id: string;
  nombre: string;
}

export interface RutaInventario {
  id: string;
  nombre: string;
}

export interface CupoDiario {
  id: string;
  areaId: string;
  insumoId: string;
  insumoNombre: string;
  unidad: string;
  /** Almacén del que sale el insumo (por defecto, el asignado al área). */
  almacenId: string;
  almacenNombre: string;
  /** Las tarjetas por defecto del área no se pueden eliminar. */
  porDefecto: boolean;
  /** Empleado que agregó la tarjeta: solo él la puede eliminar. Null en las tarjetas por defecto. */
  creadoPorId?: string | null;
  creadoPor?: string | null;
  /** Cupo base del día (25 envases, 700 bolsas…). */
  base: number;
  /** Al llegar a este disponible se habilita «Solicitar stock». */
  minimo: number;
  /** Cupo con el que inició el día: la base, o menos si el almacén no alcanzó. */
  inicial: number;
  /** Suma de lo recibido por solicitudes de stock en el día. */
  ampliado: number;
  /** Suma de las partidas del día. */
  consumido: number;
  /** inicial + ampliado − consumido (lo calcula el backend). */
  disponible: number;
  /** Lo que faltó de la base al confirmar el día. */
  faltante: number;
  /** Existencia del insumo en su almacén. */
  existencia: number;
  /** Solicitud en curso (Solicitado o Aceptado) del insumo en el área. */
  solicitudAbierta: { id: string; folio: string; estatus: EstatusSolicitud } | null;
  /** Foto del insumo (archivo en images/). Si no llega, se toma del catálogo de productos. */
  idImagen?: string | null;
  /**
   * Suma de las partidas de hoy aún sin firmar. Solo lo firmado descuenta del cupo y del almacén;
   * si no llega, el front la calcula con las partidas de hoy.
   */
  pendienteFirma?: number;
}

export type ConceptoEntrega = 'VENTA' | 'CAMBIO' | 'CAMBIO_ROTO' | 'DONADO' | 'HUECO';

export const CONCEPTOS: { value: ConceptoEntrega; label: string }[] = [
  { value: 'VENTA', label: 'Venta' },
  { value: 'CAMBIO', label: 'Cambio' },
  { value: 'CAMBIO_ROTO', label: 'Cambio por roto' },
  { value: 'DONADO', label: 'Donado' },
  { value: 'HUECO', label: 'Hueco' },
];

/** «Roto por»: un empleado o la máquina. */
export const ROTO_POR_MAQUINA = 'MAQUINA';

export interface PartidaInventario {
  id: string;
  folio: string;
  fecha: Date;
  areaId: string;
  rutaId: string | null;
  rutaNombre: string | null;
  insumoId: string;
  insumoNombre: string;
  cantidad: number;
  concepto: ConceptoEntrega;
  comentario: string;
  /** Id de empleado o ROTO_POR_MAQUINA; solo con «Cambio por roto». */
  rotoPor: string | null;
  rotoPorNombre: string | null;
  usuarioId: string | null;
  usuario: string;
  firmanteId: string | null;
  /** Quién debe firmar: el empleado que rompió, o el usuario en sesión. */
  firmante: string;
  /** Nombre del archivo de la firma (en images/). */
  firma: string | null;
  fechaFirma: Date | null;
}

/** Datos para registrar una partida. */
export interface PartidaNueva {
  areaId: string;
  rutaId: string | null;
  insumoId: string;
  cantidad: number;
  concepto: ConceptoEntrega;
  comentario: string;
  rotoPor: string | null;
}

/** Segundos que tiene el solicitante para ajustar cantidad y nota después de enviar la solicitud. */
export const SEGUNDOS_EDITAR_SOLICITUD = 120;

/** DECLINADO: el solicitante no aceptó lo que le entregaron; el insumo se queda en el almacén. */
export type EstatusSolicitud = 'SOLICITADO' | 'ACEPTADO' | 'RECHAZADO' | 'RECIBIDO' | 'CANCELADO' | 'DECLINADO';

export const ESTATUS_SOLICITUD: Record<EstatusSolicitud, { label: string; severity: 'info' | 'success' | 'danger' | 'secondary' | 'warn' }> = {
  SOLICITADO: { label: 'Solicitado', severity: 'warn' },
  ACEPTADO: { label: 'Aceptado', severity: 'info' },
  RECHAZADO: { label: 'Rechazado', severity: 'danger' },
  RECIBIDO: { label: 'Recibido', severity: 'success' },
  CANCELADO: { label: 'Cancelado', severity: 'secondary' },
  DECLINADO: { label: 'Declinado', severity: 'secondary' },
};

export interface SolicitudStock {
  id: string;
  folio: string;
  areaId: string;
  areaNombre: string;
  insumoId: string;
  insumoNombre: string;
  unidad: string;
  almacenId: string;
  almacenNombre: string;
  /** Existencia del insumo en el almacén. */
  existencia: number;
  cantidadSolicitada: number;
  /** La define el almacén al aceptar (puede ser distinta a la solicitada). */
  cantidadAEntregar: number | null;
  /** La captura el solicitante al recibir; es lo que amplía el cupo. */
  cantidadRecibida: number | null;
  /** Nota del solicitante (opcional). */
  nota: string;
  solicitadoPorId: string | null;
  solicitadoPor: string;
  fechaSolicitud: Date;
  estatus: EstatusSolicitud;
  confirmadoPor: string | null;
  fechaConfirmacion: Date | null;
  comentario: string;
  fechaRecepcion: Date | null;
  /** Quien firmó de recibido. */
  recibidoPor: string | null;
  /** Nombre del archivo de la firma de recibido del solicitante (en images/). */
  firma: string | null;
  /** Firma de entrega del responsable del almacén (en images/); null mientras no firme. */
  firmaAlmacen?: string | null;
  fechaFirmaAlmacen?: Date | null;
}
