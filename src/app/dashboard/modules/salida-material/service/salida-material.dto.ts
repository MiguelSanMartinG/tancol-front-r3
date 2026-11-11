export interface SalidaMaterialDTO{
  comentarios: string;
  empleadoEmisor: string;
  empleadoReceptor: string;
  estado: string;
  fechaElaboracion: string;
  partidas: Partida[];
  uso: string;
}

export interface Partida {
  cantidad: number;
  comentarioPartida: string;
  idAlmacen: string;
  idProductoBasico: string;
  unidadMedida: string;
}