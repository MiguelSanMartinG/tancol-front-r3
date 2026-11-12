import { Notificacion } from '@app/core/services/notificaciones.service';

export interface Fragmento {
  texto: string;
  fuerte: boolean;
}

export interface NotificacionVista {
  id: string;
  titulo: string;
  sujeto: string | null;
  lineas: Fragmento[][];
  cuando: string;
  dia: string;
  diaEtiqueta: string;
  leida: boolean;
  origen: Notificacion;
}

export interface GrupoNotificaciones {
  dia: string;
  etiqueta: string;
  items: NotificacionVista[];
}

const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
const MESES_LARGOS = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

const TITULOS: Record<string, string> = {
  'Meta semanal de venta no cubierta': 'Meta semanal no cubierta',
  'Monto semanal de equipo no cubierto': 'Monto semanal no cubierto',
  'Tolerancia de botellones rotos superada': 'Tolerancia de rotos superada',
};

const NUMERO = String.raw`[\d.,]+`;
const META = new RegExp(String.raw`^El empleado (.+) no cubrió la meta semanal de (.+)\. Mínimo: (${NUMERO}), vendido: (${NUMERO})`);
const EQUIPO = new RegExp(String.raw`^El cliente (.+) no cubrió el monto mínimo semanal del equipo (.+)\. Mínimo: (${NUMERO}), cubierto: (${NUMERO})`);
const STOCK = new RegExp(String.raw`^El insumo (.+) \(SKU: (.+)\) está bajo el stock mínimo\. Stock actual: (${NUMERO}), mínimo: (${NUMERO})`);
const ROTOS = new RegExp(String.raw`^El empleado (.+) superó la tolerancia de botellones rotos de (.+)\. Rotos en la semana: (.+?)\. Tolerancia: (.+?)\.`);

export function agruparNotificaciones(items: Notificacion[], hoy = new Date()): GrupoNotificaciones[] {
  const grupos: GrupoNotificaciones[] = [];
  for (const item of items) {
    const vista = presentarNotificacion(item, hoy);
    const ultimo = grupos.at(-1);
    if (ultimo?.dia === vista.dia) {
      ultimo.items.push(vista);
    } else {
      grupos.push({ dia: vista.dia, etiqueta: vista.diaEtiqueta, items: [vista] });
    }
  }
  return grupos;
}

export function presentarNotificacion(item: Notificacion, hoy = new Date()): NotificacionVista {
  const creada = parseFecha(item.createdAt);
  const estructurada = interpretar(item);
  return {
    id: item.id,
    titulo: TITULOS[item.titulo] ?? item.titulo,
    sujeto: estructurada?.sujeto ?? null,
    lineas: estructurada?.lineas ?? [[{ texto: item.mensaje, fuerte: false }]],
    cuando: creada ? etiquetaHora(creada) : '',
    dia: creada ? claveDia(creada) : 'sin-fecha',
    diaEtiqueta: creada ? etiquetaDia(creada, hoy) : 'Sin fecha',
    leida: item.leida,
    origen: item,
  };
}

function interpretar(item: Notificacion): { sujeto: string; lineas: Fragmento[][] } | null {
  const mensaje = item.mensaje ?? '';
  const periodo = lineaPeriodo(item);

  const meta = mensaje.match(META);
  if (meta) {
    return {
      sujeto: meta[1].trim(),
      lineas: [
        [texto('Producto '), fuerte(meta[2].trim())],
        [texto('Meta: '), fuerte(cantidad(meta[3])), texto(' · Vendido: '), fuerte(cantidad(meta[4]))],
        ...(periodo ? [periodo] : []),
      ],
    };
  }

  const equipo = mensaje.match(EQUIPO);
  if (equipo) {
    return {
      sujeto: equipo[1].trim(),
      lineas: [
        [texto('Equipo '), fuerte(equipo[2].trim())],
        [texto('Mínimo: '), fuerte(cantidad(equipo[3])), texto(' · Cubierto: '), fuerte(cantidad(equipo[4]))],
        ...(periodo ? [periodo] : []),
      ],
    };
  }

  const stock = mensaje.match(STOCK);
  if (stock) {
    return {
      sujeto: stock[1].trim(),
      lineas: [
        [texto('SKU '), fuerte(stock[2].trim())],
        [texto('Stock: '), fuerte(cantidad(stock[3])), texto(' · Mínimo: '), fuerte(cantidad(stock[4]))],
      ],
    };
  }

  const rotos = mensaje.match(ROTOS);
  if (rotos) {
    return {
      sujeto: rotos[1].trim(),
      lineas: [
        [texto('Producto '), fuerte(rotos[2].trim())],
        [texto('Rotos: '), fuerte(rotos[3].trim()), texto(' · Tolerancia: '), fuerte(rotos[4].trim())],
        ...(periodo ? [periodo] : []),
      ],
    };
  }

  return null;
}

function lineaPeriodo(item: Notificacion): Fragmento[] | null {
  const inicio = parseFecha(item.periodoInicio);
  const fin = parseFecha(item.periodoFin);
  if (inicio && fin) return [texto(`Periodo: ${formatearPeriodo(inicio, fin)}`)];
  if (inicio) return [texto(`Periodo: ${diaCorto(inicio, true)}`)];
  return null;
}

function cantidad(valor: string): string {
  const limpio = valor.trim();
  const n = Number(limpio);
  if (!Number.isFinite(n)) return limpio;
  return new Intl.NumberFormat('es-MX', { maximumFractionDigits: 2 }).format(n);
}

function parseFecha(valor: string | null | undefined): Date | null {
  if (!valor) return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2}))?/.exec(valor);
  if (!match) return null;
  return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]), Number(match[4] ?? 0), Number(match[5] ?? 0));
}

function formatearPeriodo(inicio: Date, fin: Date): string {
  const mismoDia = inicio.getFullYear() === fin.getFullYear()
    && inicio.getMonth() === fin.getMonth()
    && inicio.getDate() === fin.getDate();
  if (mismoDia) return diaCorto(inicio, true);
  if (inicio.getFullYear() === fin.getFullYear() && inicio.getMonth() === fin.getMonth()) {
    return `${inicio.getDate()}–${fin.getDate()} ${MESES[fin.getMonth()]} ${fin.getFullYear()}`;
  }
  if (inicio.getFullYear() === fin.getFullYear()) {
    return `${diaCorto(inicio, false)}–${diaCorto(fin, true)}`;
  }
  return `${diaCorto(inicio, true)}–${diaCorto(fin, true)}`;
}

function diaCorto(fecha: Date, conAnio: boolean): string {
  const base = `${fecha.getDate()} ${MESES[fecha.getMonth()]}`;
  return conAnio ? `${base} ${fecha.getFullYear()}` : base;
}

function etiquetaHora(fecha: Date): string {
  const horas = String(fecha.getHours()).padStart(2, '0');
  const minutos = String(fecha.getMinutes()).padStart(2, '0');
  return `${fecha.getDate()} ${MESES[fecha.getMonth()]} · ${horas}:${minutos}`;
}

function etiquetaDia(fecha: Date, hoy: Date): string {
  const base = `${fecha.getDate()} de ${MESES_LARGOS[fecha.getMonth()]}`;
  return fecha.getFullYear() === hoy.getFullYear() ? base : `${base} de ${fecha.getFullYear()}`;
}

function claveDia(fecha: Date): string {
  const mes = String(fecha.getMonth() + 1).padStart(2, '0');
  const dia = String(fecha.getDate()).padStart(2, '0');
  return `${fecha.getFullYear()}-${mes}-${dia}`;
}

function texto(valor: string): Fragmento {
  return { texto: valor, fuerte: false };
}

function fuerte(valor: string): Fragmento {
  return { texto: valor, fuerte: true };
}
