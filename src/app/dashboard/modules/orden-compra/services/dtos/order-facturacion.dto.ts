export interface OrdenFacturacionDto{
    comentarioFactura: string;
    facturacionOrdenEstatus: string;
    folioExterno: string;
    orderId: string;
    partidas: Partida[];
}

export interface Partida {
    cantidad: number;
    descuentoAplicado: number;
    idImpuesto: string;
    idProducto: string;
    idPartida:string;
    precioUnitario: number;
  }