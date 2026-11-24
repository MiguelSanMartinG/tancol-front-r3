export interface DepartamentoResponseDto {
  idDepartamento: string;
  nombre: string;
  alias: string;
  descripcion: string;
  createdAt: string;
  updatedAt: string;
  status: boolean;
  empleados: any[];
  idAlmacen?: string | null;
  almacenNombre?: string | null;
}