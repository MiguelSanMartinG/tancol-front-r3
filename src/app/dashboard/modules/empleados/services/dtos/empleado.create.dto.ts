export interface EmpleadoDto{
    apellidoMaterno: string;
    apellidoPaterno: string;
    correo: string;
    enabled: boolean;
    fechaNacimiento: string;
    idDepartamento: string;
    idRol: number;
    idTipoEmpleado: string;
    nombre: string;
    password?: string;
    telefono: string;
}