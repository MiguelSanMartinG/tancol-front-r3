import { CommonResponseDto } from "@core/common/common.response.dto";
import {
    ContactoEmergenciaDto,
    DocumentoEmpleadoDto,
    DomicilioEmpleadoDto,
    EstadoCivil,
    Nacionalidad,
    Sexo,
    TipoContratacion,
    TipoDocumentoEmpleado,
    TipoSangre,
} from "./empleado.create.dto";

export interface EmpleadoResponseDto{
    idEmpleado: string;
    nombre: string;
    apellidoPaterno: string;
    apellidoMaterno: string;
    email: string;
    telefono: string;
    role: RoleResponse;
    departamento: DepartamentoResponseDto;
    tipoEmpleado: TipoEmpleadoResponse;
    createdAt: string;
    updatedAt?: any;
    enabled: boolean;
    // Datos laborales (opcionales para tolerar respuestas/mocks previos)
    nss?: string | null;
    rfc?: string | null;
    curp?: string | null;
    /** 'yyyy-MM-dd' */
    fechaIngreso?: string | null;
    /** 'yyyy-MM-dd' */
    fechaEgreso?: string | null;
    observaciones?: string | null;
    tipoContratacion?: TipoContratacion | null;
    /** 'yyyy-MM-dd' */
    fechaVigencia?: string | null;
    // Datos de RH (opcionales para tolerar respuestas previas)
    nacionalidad?: Nacionalidad | null;
    sexo?: Sexo | null;
    estadoCivil?: EstadoCivil | null;
    tipoSangre?: TipoSangre | null;
    domicilio?: Partial<DomicilioEmpleadoDto> | null;
    contactosEmergencia?: ContactoEmergenciaDto[] | null;
    documentos?: DocumentoEmpleadoResponse[] | null;
}

export interface DocumentoEmpleadoResponse extends Partial<Omit<DocumentoEmpleadoDto, 'tipo' | 'archivo'>> {
    tipo: TipoDocumentoEmpleado;
    archivo: string | null;
}

export interface TipoEmpleadoResponse extends CommonResponseDto{
    idTipoEmpleado:string;
    nombre:string;
    alias:string;
    enabled:boolean;
    empleados:any;
}


export interface DepartamentoResponseDto{
    id:string;
    idDepartamento:string;
    alias:string;
    nombre: string;
    descripcion:string;
    empleados:any[]
}

export interface RoleResponse {
    id: number;
    name: string;
}

export interface EmpleadoNombreLike {
    nombre?: string | null;
    apellidoPaterno?: string | null;
    apellidoMaterno?: string | null;
}

export function getEmpleadoNombreCompleto(empleado?: EmpleadoNombreLike | null): string {
    return [
        empleado?.nombre,
        empleado?.apellidoPaterno,
        empleado?.apellidoMaterno,
    ]
        .filter((value): value is string => !!value && value.trim().length > 0)
        .join(' ');
}
