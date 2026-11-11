export interface RutasResponse {
  id: string;
  nombre: string;
  numero: string;
  tipoRuta?: string;
  notaAsignada?: any;
  choferBase: ChoferBase;
  productoBase: ProductoBase;
  vehiculosBase: VehiculosBase;
  empleadosAsignados: ChoferBase[];
  enabled: boolean;
  cratedAt: string;
  updatedAt: string;
}

export interface VehiculosBase {
  id: string;
  nombre: string;
  placas: string;
  capacidadMaxima: number;
  unidadMedida: UnidadMedida;
  numeroPoliza: string;
  vigenciaPoliza: string;
  documentoPoliza?: any;
  status: string;
  descripcion: string;
  cratedAt: string;
  updatedAt: string;
  enabled: boolean;
}

export interface UnidadMedida {
  idUnidadDeMedida: string;
  nombre: string;
  alias: string;
  updatedAt: string;
  createdAt: string;
}

export interface ProductoBase {
  idProductoComercial: string;
  categoriaProductoComercial: CategoriaProductoComercial;
  nombre: string;
  alias: string;
  descripcion: string;
  idImagen: string;
  precio: number;
  sku: string;
  createdAt: string;
  updatedAt: string;
  enabled: boolean;
}

export interface CategoriaProductoComercial {
  idCategoriaComercial: string;
  nombre: string;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ChoferBase {
  idEmpleado: string;
  nombre: string;
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