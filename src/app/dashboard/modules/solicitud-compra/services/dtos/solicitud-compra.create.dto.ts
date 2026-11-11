export interface SolicitudCompraCreateDto{
  fechaCreacionSolicitud: string
  partidas: Partida[]
  prioridad: string
  proveedorId: string
  solicitudEstatus: string
  titulo: string
}
export interface Partida {
  cantidad: number
  descuentoAplicado: number
  idProducto: string
  idPartida?:any
  idImpuesto: string
  precioUnitario: number
}
