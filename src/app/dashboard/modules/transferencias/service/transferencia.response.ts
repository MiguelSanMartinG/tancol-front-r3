import { ProductoResponseDto } from '../../producto/services/dtos/producto.response.dto';

export interface TransferenciaResponse {
  idTransferencia: string;
  motivo: string;
  comentario?: any;
  idEmpleado: IdEmpleado;
  fechaTransferencia: string;
  transferencias: TransferenciaPartidaResponse[];
}

export interface TransferenciaPartidaResponse {
  id?: string;
  idAlmacenOrigen?: string;
  idAlmacenDestino?: string;
  nombreAlmacenOrigen?: string;
  nombreAlmacenDestino?: string;
  producto?: ProductoResponseDto | null;
  cantidadTrasferida?: number;
  unidadesMedida?: { nombre?: string } | null;
  stock?: number;
  comentario?: string | null;
}

export interface IdEmpleado {
  idEmpleado: string;
  nombre: string;
  apellidoPaterno?: any;
  apellidoMaterno: string;
  email?: any;
  fechaNacimiento?: any;
  telefono?: any;
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
