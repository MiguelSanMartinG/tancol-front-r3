export interface VentaRutaDTO {
 bitacoraPartidaVentas: BitacoraPartidaVenta[];
 fecha: string;
}

export interface BitacoraPartidaVenta {
  cantidadLlegada: number;
  cantidadSalida: number;
  comentario: string;
  comisionesEmpleados: ComisionesEmpleado[];
  donados: number;
  estadoVentaRuta: string;
  huecos: number;
  idConductor: string;
  idImagenFirma: string;
  idPartida: string | null;
  idProductoComercial: string | null;
  idRuta: string | null;
  idVehiculo: string | null;
  rotos: number;
  productosNoConsignados:ProductosNoConsignados[]
  fechaFirma?: string;
}

export interface ComisionesEmpleado {
  cantidad: number;
  idEmpleado: string;
}

export interface ProductosNoConsignados{
  cantidad:number;
  idConcepto:any;
  idProductoRemanente:any;
}
