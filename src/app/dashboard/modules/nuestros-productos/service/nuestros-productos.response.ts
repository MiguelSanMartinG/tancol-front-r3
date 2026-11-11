export interface NuestrosProductosResponse {
  idProductoComercial: string;
  categoriaProductoComercial: CategoriaProductoComercial;
  nombre: string;
  alias: string;
  descripcion: string;
  idImagen: string;
  precio: number;
  sku: string;
  enabled:boolean;
  createdAt:string;
  updatedAt:string;
  unidadMedidaDefault:UnidadMedidaDefault;
  presentacion: number;
  
}

export interface CategoriaProductoComercial {
  idCategoriaComercial: string;
  nombre: string;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UnidadMedidaDefault{
      idUnidadDeMedida: string;
  nombre: string;
  alias: string;
  updatedAt: string;
  createdAt: string;

}