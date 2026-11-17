import { TipoAgua } from './medidor.create.dto';

/** Referencia corta a otro medidor (reemplazo / reemplazado). */
export interface MedidorReferenciaDto {
  idMedidor: string;
  nombre: string;
  alias: string | null;
}

/** Body de POST medidores/reset: reinicia A y lo reemplaza por B. */
export interface MedidorResetDto {
  idMedidor: string;
  idMedidorReemplazo: string;
  /** En m3 (litros / 1000), igual que medicionActual de la bitácora. */
  medicionAnterior: number;
  mensaje?: string;
}

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
  /** Medidor que reemplazó a este (este ya no recibe lecturas). */
  reemplazadoPor?: MedidorReferenciaDto | null;
  /** 'yyyy-MM-ddTHH:mm:ss' */
  fechaReemplazo?: string | null;
  /** Medidor al que este reemplazó. */
  reemplazaA?: MedidorReferenciaDto | null;
}
