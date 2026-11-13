export type TipoAgua = 'POTABLE' | 'DESMINERALIZADA' | 'PURIFICADA';

export interface MedidorCreateDto {
  alias: string;
  idsSistemasAlmacenamiento: string[];
  medicionInicial?: number;
  /** Consumo diario en litros a partir del cual se avisa al capturar. Null = sin alerta. */
  alertaConsumoLitros?: number | null;
  nombre: string;
  tipoAgua: TipoAgua;
  unidadMedicion: string;
}
