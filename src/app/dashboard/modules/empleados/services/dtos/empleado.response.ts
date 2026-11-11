import { CommonResponseDto } from "@core/common/common.response.dto";

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
