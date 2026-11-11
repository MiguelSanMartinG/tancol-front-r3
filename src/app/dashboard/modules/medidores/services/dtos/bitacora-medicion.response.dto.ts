export interface BitacoraMedicionResponseDto {
  comentario: string;
  consumo?: number;
  cratedAt: string;
  diferencia: number;
  id: string;
  liquidado?: number;
  litrosMinuto?: number | null;
  medicionFinal: number;
  medicionInicial: number;
  medidoHoy?: boolean;
  medidor: {
    alias: string;
    createdAt: string;
    deleted: boolean;
    enabled: boolean;
    idMedidor: string;
    nombre: string;
    sistemasDeAlmacenamiento: {
      alias: string;
      createdAt: string;
      enabled: boolean;
      id: string;
      nombre: string;
      updatedAt: string;
    };
    tipoAgua: 'POTABLE' | 'DESMINERALIZADA' | 'PURIFICADA';
    ultimaMedicion: number;
    unidadMedida: {
      alias: string;
      createdAt: string;
      idUnidadDeMedida: string;
      nombre: string;
      updatedAt: string;
    };
    updatedAt: string;
  };
  quedadoEnPipa?: number;
  usuario?: string | null;
}
