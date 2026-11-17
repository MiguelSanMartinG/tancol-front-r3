import { AbstractControl, FormControl, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { EmpleadoDto, requiereVigencia, TipoContratacion } from '../services/dtos/empleado.create.dto';
import { EmpleadoResponseDto } from '../services/dtos/empleado.response';

export const NSS_REGEX = /^\d{11}$/;
export const RFC_REGEX = /^[A-ZÑ&]{3,4}\d{6}[A-Z0-9]{3}$/;
export const CURP_REGEX = /^[A-Z]{4}\d{6}[HM][A-Z]{5}[A-Z0-9]\d$/;
export const OBSERVACIONES_MAX = 1000;

/** Valida el formato solo si hay valor capturado (campos opcionales). */
function formatoOpcional(regex: RegExp, errorKey: string): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const valor = typeof control.value === 'string' ? control.value.trim().toUpperCase() : control.value;
    if (valor === null || valor === undefined || valor === '') return null;
    return regex.test(String(valor)) ? null : { [errorKey]: true };
  };
}

/** Vigencia obligatoria solo si el tipo de contratación es Temporal o Practicante. */
export const vigenciaRequeridaValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
  const tipo = control.parent?.get('tipoContratacion')?.value as TipoContratacion | null | undefined;
  if (!requiereVigencia(tipo)) return null;
  return control.value ? null : { required: true };
};

/** Fecha de egreso >= fecha de ingreso (si ambas existen). */
export const egresoPosteriorValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
  const egreso = aFechaLocal(control.value);
  const ingreso = aFechaLocal(control.parent?.get('fechaIngreso')?.value);
  if (!egreso || !ingreso) return null;
  return egreso.getTime() < ingreso.getTime() ? { egresoAnterior: true } : null;
};

/** Controles de la sección "Datos laborales"; se agregan al fb.group de registrar/editar. */
export function datosLaboralesControles() {
  return {
    tipoContratacion: new FormControl<TipoContratacion | null>(null, [Validators.required]),
    fechaVigencia: new FormControl<Date | null>(null, [vigenciaRequeridaValidator]),
    fechaIngreso: new FormControl<Date | null>(null),
    fechaEgreso: new FormControl<Date | null>(null, [egresoPosteriorValidator]),
    nss: new FormControl<string | null>(null, [formatoOpcional(NSS_REGEX, 'nss')]),
    rfc: new FormControl<string | null>(null, [formatoOpcional(RFC_REGEX, 'rfc')]),
    curp: new FormControl<string | null>(null, [formatoOpcional(CURP_REGEX, 'curp')]),
    observaciones: new FormControl<string | null>(null, [Validators.maxLength(OBSERVACIONES_MAX)]),
  };
}

export interface DatosLaboralesFormValue {
  tipoContratacion?: TipoContratacion | null;
  fechaVigencia?: Date | string | null;
  fechaIngreso?: Date | string | null;
  fechaEgreso?: Date | string | null;
  nss?: string | null;
  rfc?: string | null;
  curp?: string | null;
  observaciones?: string | null;
}

type DatosLaboralesRequest = Pick<
  EmpleadoDto,
  'nss' | 'rfc' | 'curp' | 'fechaIngreso' | 'fechaEgreso' | 'observaciones' | 'tipoContratacion' | 'fechaVigencia'
>;

/** Arma la parte "datos laborales" del request (fechas 'yyyy-MM-dd', textos en mayúsculas, vacíos -> null). */
export function datosLaboralesRequest(valor: DatosLaboralesFormValue): DatosLaboralesRequest {
  const tipo = valor.tipoContratacion ?? null;
  return {
    tipoContratacion: tipo,
    fechaVigencia: requiereVigencia(tipo) ? formatearFechaApi(valor.fechaVigencia) : null,
    fechaIngreso: formatearFechaApi(valor.fechaIngreso),
    fechaEgreso: formatearFechaApi(valor.fechaEgreso),
    nss: textoONulo(valor.nss),
    rfc: textoONulo(valor.rfc, true),
    curp: textoONulo(valor.curp, true),
    observaciones: textoONulo(valor.observaciones),
  };
}

/** Valores para patchValue al editar ('yyyy-MM-dd' -> Date local). */
export function datosLaboralesDesdeResponse(resp: EmpleadoResponseDto) {
  return {
    tipoContratacion: resp.tipoContratacion ?? null,
    fechaVigencia: parsearFechaApi(resp.fechaVigencia),
    fechaIngreso: parsearFechaApi(resp.fechaIngreso),
    fechaEgreso: parsearFechaApi(resp.fechaEgreso),
    nss: resp.nss ?? null,
    rfc: resp.rfc ?? null,
    curp: resp.curp ?? null,
    observaciones: resp.observaciones ?? null,
  };
}

/** Date (o 'yyyy-MM-dd') -> 'yyyy-MM-dd' con la fecha local, sin toISOString (evita el corrimiento de zona). */
export function formatearFechaApi(valor: Date | string | null | undefined): string | null {
  const fecha = aFechaLocal(valor);
  if (!fecha) return null;
  const mes = String(fecha.getMonth() + 1).padStart(2, '0');
  const dia = String(fecha.getDate()).padStart(2, '0');
  return `${fecha.getFullYear()}-${mes}-${dia}`;
}

/** 'yyyy-MM-dd' (o con hora) -> Date local a medianoche. */
export function parsearFechaApi(valor: string | null | undefined): Date | null {
  if (!valor) return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(valor);
  if (!match) return null;
  return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
}

function aFechaLocal(valor: unknown): Date | null {
  if (!valor) return null;
  if (valor instanceof Date) {
    if (isNaN(valor.getTime())) return null;
    return new Date(valor.getFullYear(), valor.getMonth(), valor.getDate());
  }
  if (typeof valor === 'string') return parsearFechaApi(valor);
  return null;
}

function textoONulo(valor: string | null | undefined, mayusculas = false): string | null {
  if (valor === null || valor === undefined) return null;
  const limpio = String(valor).trim();
  if (!limpio) return null;
  return mayusculas ? limpio.toUpperCase() : limpio;
}
