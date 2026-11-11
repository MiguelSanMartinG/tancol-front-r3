export interface ProductoCreateDto{
    nombre: string;
    sku: string;
    alias: string;
    descripcion: string;
    idImagen?: string | null;
    categoriaProductoId: string;
    unidadMedidaDefault:string;
    tieneVigencia?: boolean;
    fechaVigencia?: string;
    marca?: string;
    modelo?: string;
    stockMinimo?: number | null;
    stockMaximo?: number | null;
    notificarStockMinimo?: boolean;
}
