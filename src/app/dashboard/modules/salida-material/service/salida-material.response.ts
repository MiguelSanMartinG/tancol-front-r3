export interface SalidaMaterialResponse{
  idOrdenInterna: string;
  uso: string;
  folio: string;
  empleadoEmisor: EmpleadoEmisor;
  empleadoReceptor: EmpleadoEmisor;
  comentario?: any;
  fechaElaboracion: string;
  estado: string;
  partidas: Partida[];
  createdAt: string;
  updatedAt: string;
}

export interface Partida {
  idPartida: string;
  almacen: Almacen;
  productoBasico: ProductoBasico;
  cantidadTranspasada: number;
  unidadMedida: string;
  comentarioPartida: string;
}

export interface ProductoBasico {
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

export interface EmpleadoEmisor {
  idEmpleado: string;
  nombre: string;
  apellidoPaterno: string;
  apellidoMaterno: string;
  email: string;
  fechaNacimiento: string;
  telefono: string;
  createdAt: string;
  updatedAt: string;
  enabled: boolean;
  nombreUsuario: string;
  departamento: Departamento;
  tipoEmpleado: TipoEmpleado;
}

export interface TipoEmpleado {
  idTipoEmpleado: string;
  nombre: string;
  alias: string;
  createdAt: string;
  updatedAt: string;
  enabled: boolean;
}

export interface Departamento {
  createdAt: string;
  updatedAt: string;
  enabled: boolean;
  idDepartamento: string;
  nombre: string;
  alias: string;
  descripcion: string;
}
