export interface ModuloResponseDto {
  idModulo: string;
  name: string;
  parent: ModuloResponseDto;
  ruta: string;
}
