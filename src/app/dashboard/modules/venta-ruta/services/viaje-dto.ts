export interface ViajeDto{
  comentario: string;
  idBitacora: string;
  idChofer: string;
  idImagenFirma: string;
  idRuta: string | null;
  idVehiculo: string | null;
  ventaTrayecto: VentaTrayecto[];
  autoGenerar:boolean;
  proceso: string;
  tipoProceso?: string;
  /** MATUTINO, VESPERTINO o DOMINICAL; solo en rutas de autoservicio (pasa a la liquidación). */
  turno?: string | null;
}

export interface VentaTrayecto {
  cantidadLlegada: number;
  cantidadSalida: number;
  comisionesEmpleado: ComisionesEmpleado[];
  huecos: number;
  idProducto: string | null;
  idUnidadMedicion: string | null;
  idVenta: string | null;
  productosFueraEspecificacion: ProductosFueraEspecificacion[];
  mermas: Merma[];
}

export interface Merma {
  idMerma?: string | null;
  idEmpleado: string | null;
  cantidad: number;
  rotoPorMaquina: boolean;
  idImagenFirma: string | null;
}

export interface ProductosFueraEspecificacion {
  cantidad: number;
  idConcepto: number;
}

export interface ComisionesEmpleado {
  cantidad: number;
  idEmpleado: string;
}
