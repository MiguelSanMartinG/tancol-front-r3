import { MedidorCreateDto } from './medidor.create.dto';

export interface MedidorUpdateDto extends MedidorCreateDto {
  enabled?: boolean;
}
