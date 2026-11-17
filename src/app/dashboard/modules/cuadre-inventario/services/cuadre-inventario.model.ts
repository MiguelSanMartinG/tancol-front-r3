export type EstadoCuadre = 'ABIERTO' | 'CERRADO';

export interface CuadreAlmacen {
  id: string;
  nombre: string;
}

export interface CuadreResumen {
  id: string;
  folio: string;
  almacen: CuadreAlmacen;
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
