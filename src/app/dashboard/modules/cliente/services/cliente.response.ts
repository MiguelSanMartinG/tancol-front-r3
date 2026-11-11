import { ChoferBase, ProductoBase, VehiculosBase } from "../../rutas/services/rutas.response";

export interface ClienteResponse {
  id: string;
  nombreComercial: string;
    noCliente: number;
  tipoContribuyente?: string;
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
  esEmpleado?: boolean;
  rutaAsociada: RutaAsociada;
  comentario?: any;
  historialNombresComerciales?: string[];
  historialRazonesSociales?: string[];
}

export interface RutaAsociada {
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

export interface InformacionFiscal {
  tipoContribuyente: string;
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
  createdAt: string;
  updatedAt: string;
  enabled: boolean;
}
