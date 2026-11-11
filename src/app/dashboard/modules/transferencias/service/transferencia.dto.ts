export interface TransferenciaDTO{
  comentario: string;
  fecha: string;
  idUsuario: string;
  motivo: string;
  transferencias: Transferencia[];
}

export interface Transferencia {
  cantidad: number;
  compentarios: string;
  idAlmacenDestino: string;
  idAlmacenOrigen: string;
  idProducto: string;
  indice: number;
  unidades: string;
}