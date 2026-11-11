export type TipoRuta = 'RP' | 'RC' | 'RH' | 'AUTO_P1' | 'AUTO' | 'AUTO_P4' | 'AUTO_PD';

export interface RutasDTO {
  empleadosAsignados: string[];
  idAyudante: string | null;
  idChofer: string;
  idVehiculo: string;
  idProductoC: string;
  letraPredeterminada: string;
  nombre: string;
  numero: string;
  tipoRuta: TipoRuta;
  enabled: boolean;
}