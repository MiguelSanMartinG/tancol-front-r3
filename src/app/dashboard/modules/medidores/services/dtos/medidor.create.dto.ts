export type TipoAgua = 'POTABLE' | 'DESMINERALIZADA' | 'PURIFICADA';

export interface MedidorCreateDto {
  alias: string;
  idsSistemasAlmacenamiento: string[];
  medicionInicial?: number;
  nombre: string;
  tipoAgua: TipoAgua;
  unidadMedicion: string;
}
