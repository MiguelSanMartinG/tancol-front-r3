import { CategoriaProductoCreateDto } from "./categoria-producto.create.dto";

export interface CategoriaProductoUpdateDto extends CategoriaProductoCreateDto{
    enabled: boolean;
}
