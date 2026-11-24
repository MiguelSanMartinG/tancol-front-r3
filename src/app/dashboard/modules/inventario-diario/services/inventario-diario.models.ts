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
  almacenId: string;
  almacenNombre: string;
}

export interface AlmacenInventario {
  id: string;
  nombre: string;
}

export interface InsumoInventario {
  id: string;
  nombre: string;
  /** Unidad de medida seleccionada en el catálogo del insumo: «piezas», «bolsas». */
  unidad: string;
  /** Ícono de la tarjeta (Font Awesome). */
  icono: string;
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
  /** Almacén del que sale el insumo (por defecto, el asignado al área). */
  almacenId: string;
  /** Las tarjetas por defecto del área no se pueden eliminar. */
  porDefecto: boolean;
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
  insumoId: string;
  cantidad: number;
  concepto: ConceptoEntrega;
  comentario: string;
  /** Id de empleado o ROTO_POR_MAQUINA; solo con «Cambio por roto». */
  rotoPor: string | null;
  usuario: string;
  /** Quién debe firmar: el empleado que rompió, o el usuario en sesión. */
  firmante: string;
  firma: string | null;
  fechaFirma: Date | null;
}

export type EstatusSolicitud = 'SOLICITADO' | 'ACEPTADO' | 'RECHAZADO' | 'RECIBIDO' | 'CANCELADO';

export const ESTATUS_SOLICITUD: Record<EstatusSolicitud, { label: string; severity: 'info' | 'success' | 'danger' | 'secondary' | 'warn' }> = {
  SOLICITADO: { label: 'Solicitado', severity: 'warn' },
  ACEPTADO: { label: 'Aceptado', severity: 'info' },
  RECHAZADO: { label: 'Rechazado', severity: 'danger' },
  RECIBIDO: { label: 'Recibido', severity: 'success' },
  CANCELADO: { label: 'Cancelado', severity: 'secondary' },
};

export interface SolicitudStock {
  id: string;
  folio: string;
  areaId: string;
  insumoId: string;
  cantidadSolicitada: number;
  /** La define el almacén al aceptar (puede ser distinta a la solicitada). */
  cantidadAEntregar: number | null;
  /** La captura el solicitante al recibir; es lo que amplía el cupo. */
  cantidadRecibida: number | null;
  /** Nota del solicitante (opcional). */
  nota: string;
  solicitadoPor: string;
  fechaSolicitud: Date;
  estatus: EstatusSolicitud;
  confirmadoPor: string | null;
  fechaConfirmacion: Date | null;
  comentario: string;
  fechaRecepcion: Date | null;
  /** Quien firmó de recibido. */
  recibidoPor: string | null;
  firma: string | null;
}

/** Confirmación del cupo al iniciar el día (la hace el responsable de área). */
export interface ConfirmacionDia {
  areaId: string;
  fecha: string; // AAAA-MM-DD
  confirmadoPor: string;
  confirmadoEn: Date;
}
