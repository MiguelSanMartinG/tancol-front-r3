import { AlmacenCreateDto } from "./almacen.create.dto";

export interface AlmacenUpdateDto extends AlmacenCreateDto{
    status: boolean;
}