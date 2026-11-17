export interface SalidaMaterialDTO{
  comentarios: string;
  empleadoEmisor: string;
  empleadoReceptor: string;
  estado: string;
  fechaElaboracion: string;
  partidas: Partida[];
  uso: string;
  /** Opcional: fileName devuelto por POST /upload con la firma de quien recibe. */
  idImagenFirmaRecibe?: string | null;
}

export interface FirmaRecibeDTO {
  idImagenFirmaRecibe: string;
}

export interface Partida {
  cantidad: number;
  comentarioPartida: string;
  idAlmacen: string;
  idProductoBasico: string;
  unidadMedida: string;
}