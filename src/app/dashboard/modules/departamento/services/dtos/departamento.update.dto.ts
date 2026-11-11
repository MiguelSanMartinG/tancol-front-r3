import { DepartamentoCreateDto } from "./departamento.create.dto";

export interface DepartamentoUpdateDto extends DepartamentoCreateDto{
    estado?: boolean;
}