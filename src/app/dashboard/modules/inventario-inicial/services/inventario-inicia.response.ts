export interface InventarioInicialResponse{
 almacen: Almacen;
  cantidad: number;
  createdAt: string;
  idInventario: string;
  producto: Producto;
  unidadesMedida: UnidadesMedida;
  updatedAt: string;
}

export interface UnidadesMedida {
  alias: string;
  createdAt: string;
  idUnidadDeMedida: string;
  nombre: string;
  updatedAt: string;
}

export interface Producto {
  alias: string;
  categoria: Categoria;
  createdAt: string;
  descripcion: string;
  enabled: boolean;
  idImagen: string;
  idProducto: string;
  nombre: string;
  sku: string;
  updatedAt: string;
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
