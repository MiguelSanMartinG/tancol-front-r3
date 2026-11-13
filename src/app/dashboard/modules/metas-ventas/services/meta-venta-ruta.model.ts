export interface MetaVentaRuta {
  id: string;
  rutaId: string;
  rutaNombre: string | null;
  rutaNumero: string | null;
  productoId: string;
  productoNombre: string | null;
  productoAlias: string | null;
  cantidadMinima: number;
  periodo: 'SEMANAL' | string;
  activa: boolean;
  fechaInicio: string;
  fechaCierre: string | null;
  createdAt: string;
  updatedAt: string;
  enabled: boolean;
}

export interface MetaVentaRutaRequest {
  idRuta: string;
  idProducto: string;
  cantidadMinima: number;
}
