export interface TablaAmonestacion {
  id: string;
  cantidadDesde: number;
  cantidadHasta: number;
  productoId: string;
  productoNombre: string | null;
  productoAlias: string | null;
  descuento: number;
  textoDescuento: string;
  createdAt: string;
  updatedAt: string;
  enabled: boolean;
}

export interface TablaAmonestacionRequest {
  cantidadDesde: number;
  cantidadHasta: number;
  idProducto: string;
  descuento: number;
}

export interface ProductoAmonestacionDisponible {
  idProducto: string;
  nombre: string;
  alias: string;
}
