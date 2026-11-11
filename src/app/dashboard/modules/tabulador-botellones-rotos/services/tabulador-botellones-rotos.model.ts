export interface TabuladorBotellonesRotos {
  id: string;
  empleadoId: string;
  empleadoNombre: string | null;
  periodo: 'SEMANAL' | string;
  tolerancia: number;
  productoId: string;
  productoNombre: string | null;
  unidadMedidaId: string;
  unidadMedidaNombre: string | null;
  createdAt: string;
  updatedAt: string;
  enabled: boolean;
}

export interface TabuladorBotellonesRotosRequest {
  idEmpleado: string;
  periodo: 'SEMANAL';
  tolerancia: number;
  idProducto: string;
  idUnidadMedida: string;
}
