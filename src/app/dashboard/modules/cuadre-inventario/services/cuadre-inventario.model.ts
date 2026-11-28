export type EstadoCuadre = 'ABIERTO' | 'CERRADO';

/** Periodicidad del conteo. */
export type TipoCuadre = 'DIARIO' | 'SEMANAL' | 'MENSUAL' | 'TRIMESTRAL' | 'SEMESTRAL' | 'ANUAL';

export const TIPOS_CUADRE: { value: TipoCuadre; label: string }[] = [
  { value: 'DIARIO', label: 'Diario' },
  { value: 'SEMANAL', label: 'Semanal' },
  { value: 'MENSUAL', label: 'Mensual' },
  { value: 'TRIMESTRAL', label: 'Trimestral' },
  { value: 'SEMESTRAL', label: 'Semestral' },
  { value: 'ANUAL', label: 'Anual' },
];

export function etiquetaTipoCuadre(tipo: TipoCuadre | null | undefined): string {
  return TIPOS_CUADRE.find((t) => t.value === tipo)?.label ?? '—';
}

export interface CuadreCategoria {
  id: string;
  nombre: string;
}

export interface CuadreAlmacen {
  id: string;
  nombre: string;
}

export interface CuadreResumen {
  id: string;
  folio: string;
  almacen: CuadreAlmacen;
  /** Null en cuadres anteriores a este campo. */
  tipo?: TipoCuadre | null;
  /** Categorías contadas; vacío = todo el almacén. */
  categorias?: CuadreCategoria[];
  estado: EstadoCuadre;
  creadoPor: string;
  /** ISO local 'yyyy-MM-ddTHH:mm:ss' */
  fechaCreacion: string;
  cerradoPor: string | null;
  fechaCierre: string | null;
  ajusteAplicado: boolean;
  totalPartidas: number;
  partidasCapturadas: number;
  partidasConDiferencia: number;
}

export interface CuadrePartida {
  idPartida: string;
  idProducto: string;
  producto: string;
  sku: string | null;
  unidad: string | null;
  cantidadSistema: number;
  cantidadFisica: number | null;
  /** cantidadFisica - cantidadSistema (+ sobrante, - faltante) */
  diferencia: number | null;
}

export interface CuadreDetalle extends CuadreResumen {
  observaciones: string | null;
  idImagenFirma: string | null;
  fechaFirma: string | null;
  partidas: CuadrePartida[];
}

export interface CuadreCreateDto {
  idAlmacen: string;
  tipo: TipoCuadre;
  /** Vacío = todo el inventario del almacén. */
  idsCategoria: string[];
}

export interface CuadrePartidasUpdateDto {
  partidas: { idPartida: string; cantidadFisica: number | null }[];
  observaciones?: string | null;
}

export interface CuadreCerrarDto {
  idImagenFirma: string;
  ajustarExistencia: boolean;
  observaciones?: string | null;
}

export interface CuadreFiltro {
  idAlmacen?: string | null;
  estado?: EstadoCuadre | null;
}
