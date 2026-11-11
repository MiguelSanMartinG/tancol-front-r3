import { ProductoResponseDto } from "@app/dashboard/modules/producto/services/dtos/producto.response.dto";
import { ProveedorResponseDto } from "@app/dashboard/modules/proveedor/services/dtos/proveedor.response.dto";
import { CommonResponseDto } from "@core/common/common.response.dto";

export interface OrdenResponseDto{
  idSolicitud: string;
  titulo: string;
  folio: string;
  totalOrden: number;
  fechaCreacionSolicitud: string;
  fechaModificacionSolicitud: string;
  prioridad: string;
  solicitudEstatus: string;
  proveedor: Proveedor;
  createdAt: string;
  updatedAt: string;
  partidas: Partida[];
}
export interface Partida {
  idPartida: string;
  cantidad: number;
  precioUnitario: number;
  descuentoAplicado: number;
  impuestoAplicado: number;
  precioProveedor: PrecioProveedor;
  tipoImpuesto: TipoImpuesto;
  almacen?: any;
  producto: ProductoEntity;
  unidadesRecibidas?: any;
  comentarioPartida?: any;
}

export interface TipoImpuesto {
  id: string;
  nombre: string;
  porcentaje: number;
  enabled: boolean;
  createdAt: string;
  updatedAt?: any;
}

export interface PrecioProveedor {
  idPrecio: string;
  precio: number;
  productoEntity: ProductoEntity;
  proveedorEntity: Proveedor;
  createdAt: string;
  updatedAt?: any;
}

export interface ProductoEntity {
  idProducto: string;
  nombre: string;
  alias: string;
  descripcion: string;
  sku: string;
  nombreCategoria: string;
  createdAt: string;
  updatedAt?: any;
}

export interface Proveedor {
  idProveedor: string;
  nombreComercial: string;
  nombreTipoProveedor: string;
  condicionPago: string;
  correo: string;
  telefono: string;
  infoFiscal: InfoFiscal;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface InfoFiscal {
  tipoContribuyente: string;
  razonSocial: string;
  rfc: string;
  codigoPostal: string;
  tipoVialidad: string;
  nombreVialidad: string;
  numeroExterior: string;
  numeroInterior: string;
  colonia: string;
  localidad: string;
  municipio: string;
  entidadFederativa: string;
  calle1: string;
  calle2: string;
}