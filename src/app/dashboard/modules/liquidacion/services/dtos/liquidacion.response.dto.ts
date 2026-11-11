export interface LiquidacionResponse {
    idLiquidacion: string;
    observaciones:string;
  folio: string;
  ruta: Ruta;
  fecha: string;
  bloqueNota: string;
  estadosLiquidacion: string;
  origenBitacora?: boolean;
  totalizados: Totalizado[];
  partidas: Partida[];
  createdAt: string;
  updatedAt: string;
}

export interface Partida {
  idPartida: string;
  folio: number | null;
  conceptosVentas?: any;
  cliente: Cliente;
  productoComercial: ProductoBase;
  cantidad: number;
  precio: number;
  importe: number;
  formaPago: string;
    descuento: number;
factura:boolean;
}

export interface Cliente {
  id: string;
  nombreComercial: string;
  noCliente: number;
  tipoDeCliente: TipoDeCliente;
  tipoPago: string;
  diasDeCredito: number;
  correo: string;
  telefono: string;
  fechaAlta: string;
  informacionFiscal: InformacionFiscal;
  createdAt: string;
  updatedAt: string;
  enabled: boolean;
  rutaAsociada: RutaAsociada;
  comentario?: any;
}

export interface RutaAsociada {
  id: string;
  nombre: string;
  numero: string;
  notaAsignada: string;
  choferBase: ChoferBase;
  productoBase: ProductoBase2;
  vehiculosBase: VehiculosBase2;
  empleadosAsignados: ChoferBase[];
  enabled: boolean;
  cratedAt: string;
  updatedAt: string;
}

export interface VehiculosBase2 {
  id: string;
  nombre: string;
  placas: string;
  capacidadMaxima: number;
  unidadMedida: UnidadMedidaDefault;
  numeroPoliza: string;
  vigenciaPoliza: string;
  documentoPoliza?: any;
  status: string;
  descripcion: string;
  cratedAt: string;
  updatedAt: string;
  enabled: boolean;
}

export interface ProductoBase2 {
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
  unidadMedidaDefault?: any;
  enabled: boolean;
}

export interface InformacionFiscal {
  tipoContribuyente?: any;
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

export interface TipoDeCliente {
  nombre: string;
  alias: string;
  idTipoCliente: string;
  enabled: boolean;
}

export interface Totalizado {
  id: string;
  producto: ProductoBase;
  empleados: any[];
}

export interface Ruta {
  id: string;
  nombre: string;
  numero: string;
  notaAsignada: string;
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
  unidadMedida: UnidadMedidaDefault;
  numeroPoliza: string;
  vigenciaPoliza: string;
  documentoPoliza: string;
  status: string;
  descripcion: string;
  cratedAt: string;
  updatedAt: string;
  enabled: boolean;
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
  unidadMedidaDefault: UnidadMedidaDefault;
  enabled: boolean;
}

export interface UnidadMedidaDefault {
  idUnidadDeMedida: string;
  nombre: string;
  alias: string;
  updatedAt: string;
  createdAt: string;
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
