import { ProductoResponseDto } from "@app/dashboard/modules/producto/services/dtos/producto.response.dto";
import { ProveedorResponseDto } from "@app/dashboard/modules/proveedor/services/dtos/proveedor.response.dto";
import { CommonResponseDto } from "@core/common/common.response.dto";

export interface OrdenResponseDto extends CommonResponseDto{
  idSolicitud: string;
  titulo: string;
  folio: string;
  fechaSolicitud: string;
  fechaCreacionSolicitud:string;
  fechaUltimaModificacion: string;
  prioridad: string;
  solicitanteEstatus: string;
  proveedor: ProveedorResponseDto;
  totalOrden: number;
  partidas: Partida[]
}
export interface Partida {
  id: string
  cantidad: number
  precio: number
  unidadesRecibidas: number
  comentariosRecibo: string
  almacen: Almacen;
  producto: ProductoResponseDto;
  descuentoAplicado?:number;
  precioUnitario?:number;
  tipoImpuesto:{id:string}
}

export interface Almacen {
  id: string
  nombre: string
  status: boolean
  createdAt: string
  updatedAt: string
}
