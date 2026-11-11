export interface LiquidacionDTO {
  bloqueNota: string;
  estado: string;
  fecha: string;
  idRuta: string;
  observaciones:string;
  partida: Partida[];
  totalizados: Totalizado[];
}

export interface Totalizado {
  choferes: Chofere[];
  idProducto: string;
  idTotalizado: string;
}

export interface Chofere {
  idEmpleado: string;
  total: number;
  ayudantes: Ayudantes[];
}

export interface Ayudantes{
    idEmpleado: string;
  total: number;
}

export interface Partida {
  cantidad: number;
  descuento:number;
  folio: number | null;
  formaPago: string;
  idCliente: string;
  idConceptoVenta: string;
  idPartida: string;
  idProducto: string;
  precio: number;
  factura:boolean;
}

export interface CancelarPartidaRequest {
  motivo: string;
  nuevaPartida: Partida;
}
