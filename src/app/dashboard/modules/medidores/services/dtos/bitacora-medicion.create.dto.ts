export interface BitacoraMedicionCreateDto {
  comentario: string;
  idMedidor: string;
  liquidado?: number;
  litrosMinuto?: number;
  medicionActual: number;
  quedadoEnPipa?: number;
}
