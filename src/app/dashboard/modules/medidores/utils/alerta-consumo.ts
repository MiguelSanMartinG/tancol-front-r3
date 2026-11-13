/**
 * Alerta (no restrictiva) de lecturas fuera de lo común.
 * Cada medidor puede tener un consumo diario máximo esperado en litros (alertaConsumoLitros).
 * Al capturar la lectura final se avisa si el consumo del día lo supera o si sale negativo;
 * el usuario siempre puede guardar de todos modos.
 */
export interface AvisoConsumo {
  tipo: 'alto' | 'negativo';
  consumoLitros: number;
  mensaje: string;
}

/** Litros positivos con hasta 2 decimales; el campo puede quedar vacío (sin alerta). */
export const ALERTA_CONSUMO_PATRON = /^\d+([.,]\d{1,2})?$/;

const formatoLitros =new Intl.NumberFormat('es-MX', { maximumFractionDigits: 2 });

function aNumero(valor: unknown): number | null {
  if (valor === null || valor === undefined || valor === '') return null;
  const numero = Number(String(valor).replace(',', '.').trim());
  return Number.isFinite(numero) ? numero : null;
}

/** Valor del formulario → número para el API. Vacío = sin alerta (null). */
export function alertaConsumoParaGuardar(valor: unknown): number | null {
  const numero = aNumero(valor);
  return numero === null || numero < 0 ? null : numero;
}

/**
 * Igual que evaluarConsumo, pero solo cuando el usuario ya escribió la lectura
 * (el campo arranca en 0 y no debe avisar al abrir el formulario).
 */
export function evaluarCaptura(
  control: { value: unknown; dirty: boolean } | null | undefined,
  lecturaInicialLitros: number,
  alertaConsumoLitros: number | null | undefined,
): AvisoConsumo | null {
  if (!control?.dirty) return null;
  return evaluarConsumo(control.value, lecturaInicialLitros, alertaConsumoLitros);
}

/**
 * Revisa el consumo del día (lectura final − lectura inicial, ambas en litros).
 * Devuelve null si no hay nada que avisar.
 */
export function evaluarConsumo(
  lecturaFinalLitros: unknown,
  lecturaInicialLitros: number,
  alertaConsumoLitros: number | null | undefined,
): AvisoConsumo | null {
  const final = aNumero(lecturaFinalLitros);
  if (final === null) return null;
  const consumo = final - (lecturaInicialLitros ?? 0);

  if (consumo < 0) {
    return {
      tipo: 'negativo',
      consumoLitros: consumo,
      mensaje: `La lectura es menor que la inicial (${formatoLitros.format(lecturaInicialLitros)} LTS): el consumo saldría negativo.`,
    };
  }

  const limite = aNumero(alertaConsumoLitros);
  if (limite !== null && limite > 0 && consumo > limite) {
    return {
      tipo: 'alto',
      consumoLitros: consumo,
      mensaje: `Consumo de ${formatoLitros.format(consumo)} LTS, mayor a lo habitual para este medidor (${formatoLitros.format(limite)} LTS).`,
    };
  }
  return null;
}
