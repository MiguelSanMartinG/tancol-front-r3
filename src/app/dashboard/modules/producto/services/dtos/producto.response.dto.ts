import { CommonResponseDto } from "@core/common/common.response.dto";

export interface ProductoResponseDto extends CommonResponseDto{
    nombre: string;
    nombreCategoria:string;
    idCategoriaPadre?: string | null;
    nombreCategoriaPadre?: string | null;
    sku: string;
    alias: string;
    descripcion: string;
    idImagen?: string
    categoria_producto_id: string;
    categoria?: {
      enabled: boolean;
      idCategoria: string;
      nombre: string;
      idCategoriaPadre?: string | null;
      nombreCategoriaPadre?: string | null;
    };
    idProducto:string;
    enabled:boolean;
    tieneVigencia?: boolean;
    fechaVigencia?: string | null;
    marca?: string | null;
    modelo?: string | null;
    stockMinimo?: number | null;
    stockMaximo?: number | null;
    notificarStockMinimo?: boolean;
    unidadMedidaDefault:UnidadMedidaDefault
}

export interface UnidadMedidaDefault{
      idUnidadDeMedida: string;
  nombre: string;
  alias: string;
  updatedAt: string;
  createdAt: string;

}
