import { TipoImpuestoCreateDto } from "./tipo-impuesto.create.dto";

export interface TipoImpuestoUpdateDto extends TipoImpuestoCreateDto{
    enabled: boolean;
}