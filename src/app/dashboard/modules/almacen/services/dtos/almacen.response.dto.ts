import { CommonResponseDto } from "@core/common/common.response.dto";

export interface AlmacenResponseDto extends CommonResponseDto{
    nombre: string;
    status: boolean;
    idResponsable?: string | null;
    responsableNombre?: string | null;
}