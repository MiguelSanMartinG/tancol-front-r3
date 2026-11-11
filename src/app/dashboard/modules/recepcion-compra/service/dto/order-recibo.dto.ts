export interface OrdenReciboDto{
  comentarioRecibo: string;
  idOrden: string;
  partidas: Partida[];
  recepcionEstatus:string;
}

export interface Partida {
    verificado: boolean;
    idAlmacen: string;
    idPartida: string;
    unidadesRecibidas: number;
    presentacionProducto:PresentacionProducto
  }

export interface PresentacionProducto{
  idPrecio:string;
  precio:number;
}