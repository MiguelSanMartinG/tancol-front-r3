import { CommonResponseDto } from "@core/common/common.response.dto";

export interface TipoEmpleadoResponse extends CommonResponseDto{
    idTipoEmpleado:string;
    nombre:string;
    alias:string;
    enabled:boolean;
    empleados:any;
}