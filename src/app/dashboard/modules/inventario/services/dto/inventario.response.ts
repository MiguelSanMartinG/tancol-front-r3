export interface InventarioResponse{
 idInventario: string;
  cantidad: number;
  almacen: Almacen;
  producto: Producto;
  unidadesMedida?: any;
}

export interface Producto {
  createdAt: string;
  updatedAt: string;
  enabled: boolean;
  idProducto: string;
  nombre: string;
  idImagen: string;
  descripcion: string;
  sku: string;
  alias: string;
  categoria: Categoria;
  marca?: string | null;
  modelo?: string | null;
  stockMinimo?: number | null;
  stockMaximo?: number | null;
  notificarStockMinimo?: boolean;
  unidadesMedida?: any;
  tieneVigencia?: boolean;
  fechaVigencia?: string | null;
}

export interface Categoria {
  enabled: boolean;
  idCategoria: string;
  nombre: string;
  idCategoriaPadre?: string | null;
  nombreCategoriaPadre?: string | null;
}

export interface Almacen {
  enabled: boolean;
  idAlmacen: string;
  nombre: string;
}
