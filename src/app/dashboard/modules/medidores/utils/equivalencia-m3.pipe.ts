import { Pipe, PipeTransform } from '@angular/core';

/**
 * Las lecturas se capturan y muestran en litros (LTS); el backend las guarda en m3.
 * Estas pipes muestran el equivalente en m3 como referencia debajo de campos y tablas.
 */
const LITROS_POR_M3 = 1000;
const formatoM3 = new Intl.NumberFormat('es-MX', { maximumFractionDigits: 3 });
const formatoLitros = new Intl.NumberFormat('es-MX', { maximumFractionDigits: 2 });

function aNumero(valor: unknown): number | null {
  if (valor === null || valor === undefined || valor === '') return null;
  const numero = Number(String(valor).replace(',', '.').trim());
  return Number.isFinite(numero) ? numero : null;
}

/** Leyenda para un campo de captura en litros: "Capturaste 1,500 LTS, equivale a 1.5 m3." */
@Pipe({ name: 'leyendaM3' })
export class LeyendaM3Pipe implements PipeTransform {
  transform(litrosCapturados: unknown): string {
    const litros = aNumero(litrosCapturados);
    if (litros === null || litros < 0) return 'Captura en LTS para ver su equivalente en m3.';
    return `Capturaste ${formatoLitros.format(litros)} LTS, equivale a ${formatoM3.format(litros / LITROS_POR_M3)} m3.`;
  }
}

/** Equivalente en m3 de un valor en litros: "1.5 m3". */
@Pipe({ name: 'litrosAM3' })
export class LitrosAM3Pipe implements PipeTransform {
  transform(litros: unknown): string {
    const valor = aNumero(litros);
    return `${formatoM3.format((valor ?? 0) / LITROS_POR_M3)} m3`;
  }
}
