import { CommonResponseDto } from "@core/common/common.response.dto";

export interface CategoriaProductoResponseDto extends CommonResponseDto{
    idCategoria:string;
    nombre: string;
    enabled: boolean;
    idCategoriaPadre?: string | null;
    nombreCategoriaPadre?: string | null;
    subcategorias?: Array<{ idCategoria: string; nombre: string }>;
    productoList?: Array<{ idProducto: string; nombre: string; sku?: string }>;
}
