import { ProductoCreateDto } from "./producto.create.dto";

export interface ProductoUpdateDto extends ProductoCreateDto{
    status: boolean;
}