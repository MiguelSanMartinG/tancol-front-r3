export interface DepartamentoResponseDto {
  idDepartamento: string;
  nombre: string;
  alias: string;
  descripcion: string;
  createdAt: string;
  updatedAt: string;
  status: boolean;
  empleados: any[];
}