import { CommonResponseDto } from "@core/common/common.response.dto";

export interface TipoImpuestoResponseDto extends CommonResponseDto{
    nombre: string;
    porcentaje: number;
    enabled: boolean;
}
