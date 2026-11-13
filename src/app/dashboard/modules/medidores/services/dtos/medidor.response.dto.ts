import { TipoAgua } from './medidor.create.dto';

export interface MedidorResponseDto {
  createdAt: string;
  deleted: boolean;
  enabled: boolean;
  idMedidor: string;
  nombre: string;
  alias: string;
  sistemasDeAlmacenamiento: Array<{
    alias: string;
    createdAt: string;
    enabled: boolean;
    id: string;
    nombre: string;
    updatedAt: string;
  }>;
  tipoAgua: TipoAgua;
  ultimaMedicion: number;
  alertaConsumoLitros?: number | null;
  fechaUltimaMedicion: string | null;
  unidadMedida: {
    alias: string;
    createdAt: string;
    idUnidadDeMedida: string;
    nombre: string;
    updatedAt: string;
  };
  updatedAt: string;
  medidoresHijos?: MedidorResponseDto[];
}
