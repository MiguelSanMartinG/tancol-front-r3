export interface VehiculosResponse{
  id: string;
  nombre: string;
  placas: string;
  capacidadMaxima: number;
  unidadMedida: UnidadMedida;
  numeroPoliza?: any;
  vigenciaPoliza: string;
  documentoPoliza?: any;
  status: string;
  descripcion: string;
  cratedAt: string;
  updatedAt: string;
  enabled: boolean;
}

export interface UnidadMedida {
  idUnidadDeMedida: string;
  nombre: string;
  alias: string;
  updatedAt: string;
  createdAt: string;
}