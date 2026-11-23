import { AbstractControl, FormArray, FormControl, FormGroup, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import {
  ContactoEmergenciaDto,
  DocumentoEmpleadoDto,
  DomicilioEmpleadoDto,
  EmpleadoDto,
  EstadoCivil,
  Nacionalidad,
  NivelEstudios,
  Sexo,
  TipoDocumentoEmpleado,
  TipoSangre,
} from '../services/dtos/empleado.create.dto';
import { EmpleadoResponseDto } from '../services/dtos/empleado.response';
import { formatearFechaApi, parsearFechaApi, textoONulo } from './datos-laborales';

// ===================== Opciones =====================

export const NACIONALIDADES: { value: Nacionalidad; label: string }[] = [
  { value: 'MEXICANA', label: 'Mexicana' },
  { value: 'EXTRANJERA', label: 'Extranjera' },
];

export const SEXOS: { value: Sexo; label: string }[] = [
  { value: 'MASCULINO', label: 'Masculino' },
  { value: 'FEMENINO', label: 'Femenino' },
  { value: 'NO_ESPECIFICADO', label: 'No especificado' },
];

export const ESTADOS_CIVILES: { value: EstadoCivil; label: string }[] = [
  { value: 'SOLTERO', label: 'Soltero' },
  { value: 'CASADO', label: 'Casado' },
  { value: 'DIVORCIADO', label: 'Divorciado' },
  { value: 'VIUDO', label: 'Viudo' },
  { value: 'UNION_LIBRE', label: 'Unión libre' },
];

export const TIPOS_SANGRE: { value: TipoSangre; label: string }[] = (
  ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'] as TipoSangre[]
).map((valor) => ({ value: valor, label: valor }));

export const NIVELES_ESTUDIOS: { value: NivelEstudios; label: string }[] = [
  { value: 'PRIMARIA', label: 'Primaria' },
  { value: 'SECUNDARIA', label: 'Secundaria' },
  { value: 'PREPARATORIA', label: 'Preparatoria' },
  { value: 'UNIVERSIDAD', label: 'Universidad' },
  { value: 'POSGRADO', label: 'Posgrado' },
  { value: 'MAESTRIA', label: 'Maestría' },
  { value: 'DOCTORADO', label: 'Doctorado' },
];

export const BANCOS: { value: string; label: string }[] = [
  'BBVA',
  'Santander',
  'Banorte',
  'Banamex',
  'HSBC',
  'Scotiabank',
  'Inbursa',
  'Banco Azteca',
  'BanCoppel',
  'Banregio',
  'Afirme',
  'Banbajío',
  'Bancrea',
  'Multiva',
  'Hey Banco',
  'Mifel',
  'Ve por Más',
  'Nu México',
  'Spin by OXXO',
  'Otro',
].map((banco) => ({ value: banco, label: banco }));

export const CONTACTOS_EMERGENCIA_MAX = 3;
export const CLABE_REGEX = /^\d{18}$/;

/** Datos extra que puede llevar un documento, además del archivo. */
export type CampoDocumento = 'fecha' | 'fechaVigencia' | 'mes' | 'banco' | 'clabe' | 'nivelEstudios';

export interface DocumentoConfig {
  tipo: TipoDocumentoEmpleado;
  label: string;
  campos: CampoDocumento[];
  /** Etiqueta del campo `fecha` (cambia según el documento). */
  etiquetaFecha?: string;
}

/** Un renglón por tipo de documento, en el orden en que se muestran. */
export const DOCUMENTOS: DocumentoConfig[] = [
  { tipo: 'INE', label: 'INE', campos: ['fecha', 'fechaVigencia'], etiquetaFecha: 'Fecha de emisión' },
  { tipo: 'ACTA_NACIMIENTO', label: 'Acta de nacimiento', campos: [] },
  { tipo: 'CURP', label: 'CURP', campos: [] },
  { tipo: 'CONSTANCIA_SITUACION_FISCAL', label: 'Constancia de situación fiscal', campos: ['mes'] },
  { tipo: 'COMPROBANTE_DOMICILIO', label: 'Comprobante de domicilio', campos: ['mes'] },
  {
    tipo: 'IMSS',
    label: 'Hoja de asignación o vigencia IMSS',
    campos: ['fecha', 'fechaVigencia'],
    etiquetaFecha: 'Fecha de inicio',
  },
  { tipo: 'CARATULA_BANCARIA', label: 'Carátula bancaria', campos: ['banco', 'clabe'] },
  { tipo: 'COMPROBANTE_ESTUDIOS', label: 'Comprobante de estudios', campos: ['nivelEstudios'] },
  { tipo: 'EXPERIENCIA_LABORAL', label: 'Experiencia laboral', campos: [] },
  { tipo: 'CONTRATO', label: 'Contrato', campos: ['fecha', 'fechaVigencia'], etiquetaFecha: 'Fecha de inicio' },
  { tipo: 'LICENCIA_CONDUCIR', label: 'Licencia de conducir', campos: ['fechaVigencia'] },
  { tipo: 'ANTECEDENTES_NO_PENALES', label: 'Antecedentes no penales', campos: ['fechaVigencia'] },
];

/** Formatos y tamaño aceptados para los archivos de documentos. */
export const DOCUMENTO_ACCEPT = '.pdf,image/png,image/jpeg';
export const DOCUMENTO_ACCEPT_LABEL = 'PDF, JPG o PNG';
export const DOCUMENTO_MAX_MB = 10;

// ===================== Validadores =====================

/** CLABE de 18 dígitos, solo si se capturó (campo opcional). */
export const clabeOpcionalValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
  const valor = typeof control.value === 'string' ? control.value.trim() : control.value;
  if (valor === null || valor === undefined || valor === '') return null;
  return CLABE_REGEX.test(String(valor)) ? null : { clabe: true };
};

// ===================== Controles =====================

const DOMICILIO_CAMPOS: (keyof DomicilioEmpleadoDto)[] = [
  'codigoPostal',
  'tipoVialidad',
  'nombreVialidad',
  'numeroExterior',
  'numeroInterior',
  'colonia',
  'localidad',
  'municipio',
  'entidadFederativa',
  'calle1',
  'calle2',
];

function domicilioGrupo() {
  const controles = {} as Record<keyof DomicilioEmpleadoDto, FormControl<string | null>>;
  for (const campo of DOMICILIO_CAMPOS) controles[campo] = new FormControl<string | null>(null);
  return new FormGroup(controles);
}

/** Grupo de un contacto de emergencia: nombre y teléfono obligatorios si se agrega el contacto. */
export function contactoEmergenciaGrupo(valor?: Partial<ContactoEmergenciaDto> | null) {
  return new FormGroup({
    nombre: new FormControl<string | null>(valor?.nombre ?? null, [Validators.required]),
    parentesco: new FormControl<string | null>(valor?.parentesco ?? null),
    telefono: new FormControl<string | null>(valor?.telefono ?? null, [Validators.required]),
    correo: new FormControl<string | null>(valor?.correo ?? null, [Validators.email]),
  });
}

export type ContactoEmergenciaGrupo = ReturnType<typeof contactoEmergenciaGrupo>;

/** Grupo de un documento. `archivo` = nombre ya guardado; `archivoNuevo` = archivo elegido sin subir. */
export function documentoGrupo(tipo: TipoDocumentoEmpleado) {
  return new FormGroup({
    tipo: new FormControl<TipoDocumentoEmpleado>(tipo, { nonNullable: true }),
    archivo: new FormControl<string | null>(null),
    archivoNuevo: new FormControl<File | null>(null),
    fecha: new FormControl<Date | null>(null),
    fechaVigencia: new FormControl<Date | null>(null),
    mes: new FormControl<Date | null>(null),
    nivelEstudios: new FormControl<NivelEstudios | null>(null),
    banco: new FormControl<string | null>(null),
    clabe: new FormControl<string | null>(null, [clabeOpcionalValidator]),
  });
}

export type DocumentoGrupo = ReturnType<typeof documentoGrupo>;

/** Controles de las secciones de RH; se agregan al fb.group de registrar/editar. */
export function datosRhControles() {
  return {
    nacionalidad: new FormControl<Nacionalidad | null>(null),
    sexo: new FormControl<Sexo | null>(null),
    estadoCivil: new FormControl<EstadoCivil | null>(null),
    tipoSangre: new FormControl<TipoSangre | null>(null),
    domicilio: domicilioGrupo(),
    contactosEmergencia: new FormArray<ContactoEmergenciaGrupo>([]),
    // Siempre un grupo por tipo, en el orden de DOCUMENTOS.
    documentos: new FormArray<DocumentoGrupo>(DOCUMENTOS.map((doc) => documentoGrupo(doc.tipo))),
  };
}

// ===================== Mapeo =====================

export interface DocumentoFormValue {
  tipo?: TipoDocumentoEmpleado;
  archivo?: string | null;
  archivoNuevo?: File | null;
  fecha?: Date | string | null;
  fechaVigencia?: Date | string | null;
  mes?: Date | string | null;
  nivelEstudios?: NivelEstudios | null;
  banco?: string | null;
  clabe?: string | null;
}

export interface DatosRhFormValue {
  nacionalidad?: Nacionalidad | null;
  sexo?: Sexo | null;
  estadoCivil?: EstadoCivil | null;
  tipoSangre?: TipoSangre | null;
  domicilio?: Partial<Record<keyof DomicilioEmpleadoDto, string | null>> | null;
  contactosEmergencia?: Partial<Record<keyof ContactoEmergenciaDto, string | null>>[] | null;
  documentos?: DocumentoFormValue[] | null;
}

type DatosRhRequest = Pick<
  EmpleadoDto,
  'nacionalidad' | 'sexo' | 'estadoCivil' | 'tipoSangre' | 'domicilio' | 'contactosEmergencia' | 'documentos'
>;

/** Nombres guardados de los archivos recién subidos, por tipo de documento. */
export type ArchivosSubidos = Partial<Record<TipoDocumentoEmpleado, string>>;

export function configDocumento(tipo: TipoDocumentoEmpleado | null | undefined): DocumentoConfig | undefined {
  return DOCUMENTOS.find((doc) => doc.tipo === tipo);
}

/** Archivos nuevos que hay que subir antes de guardar. */
export function documentosPorSubir(valor: DatosRhFormValue): { tipo: TipoDocumentoEmpleado; file: File }[] {
  return (valor.documentos ?? [])
    .filter((doc): doc is DocumentoFormValue & { tipo: TipoDocumentoEmpleado; archivoNuevo: File } =>
      !!doc.tipo && doc.archivoNuevo instanceof File
    )
    .map((doc) => ({ tipo: doc.tipo, file: doc.archivoNuevo }));
}

/** El documento tiene archivo (nuevo o ya guardado). */
export function documentoTieneArchivo(doc: DocumentoFormValue | null | undefined): boolean {
  return !!doc && (doc.archivoNuevo instanceof File || !!textoONulo(doc.archivo));
}

/** Capturó datos del documento pero no adjuntó archivo: ese documento no se enviará. */
export function documentoSinArchivo(doc: DocumentoFormValue | null | undefined): boolean {
  if (!doc || documentoTieneArchivo(doc)) return false;
  const campos = configDocumento(doc.tipo)?.campos ?? [];
  return campos.some((campo) => {
    const valor = doc[campo];
    return typeof valor === 'string' ? valor.trim() !== '' : !!valor;
  });
}

/**
 * Arma la parte de RH del request. Textos vacíos -> null, fechas 'yyyy-MM-dd', mes 'yyyy-MM'.
 * Solo se envían los documentos con archivo (el recién subido tiene prioridad sobre el guardado).
 */
export function datosRhParaRequest(valor: DatosRhFormValue, subidos: ArchivosSubidos = {}): DatosRhRequest {
  const domicilio = {} as DomicilioEmpleadoDto;
  for (const campo of DOMICILIO_CAMPOS) domicilio[campo] = textoONulo(valor.domicilio?.[campo]);

  const contactosEmergencia: ContactoEmergenciaDto[] = (valor.contactosEmergencia ?? []).map((contacto) => ({
    nombre: textoONulo(contacto.nombre),
    parentesco: textoONulo(contacto.parentesco),
    telefono: textoONulo(contacto.telefono),
    correo: textoONulo(contacto.correo),
  }));

  const documentos: DocumentoEmpleadoDto[] = [];
  for (const doc of valor.documentos ?? []) {
    const config = configDocumento(doc.tipo);
    if (!config) continue;
    const archivo = subidos[config.tipo] ?? (doc.archivoNuevo instanceof File ? null : textoONulo(doc.archivo));
    if (!archivo) continue;
    const usa = (campo: CampoDocumento) => config.campos.includes(campo);
    documentos.push({
      tipo: config.tipo,
      archivo,
      fecha: usa('fecha') ? formatearFechaApi(doc.fecha) : null,
      fechaVigencia: usa('fechaVigencia') ? formatearFechaApi(doc.fechaVigencia) : null,
      mes: usa('mes') ? formatearMesApi(doc.mes) : null,
      nivelEstudios: usa('nivelEstudios') ? doc.nivelEstudios ?? null : null,
      banco: usa('banco') ? textoONulo(doc.banco) : null,
      clabe: usa('clabe') ? textoONulo(doc.clabe) : null,
    });
  }

  return {
    nacionalidad: valor.nacionalidad ?? null,
    sexo: valor.sexo ?? null,
    estadoCivil: valor.estadoCivil ?? null,
    tipoSangre: valor.tipoSangre ?? null,
    domicilio,
    contactosEmergencia,
    documentos,
  };
}

/**
 * Valores para patchValue al editar. Antes de aplicarlos, ajusta el FormArray de contactos con
 * `ajustarContactosEmergencia` (patchValue no agrega elementos a un FormArray).
 */
export function datosRhDesdeResponse(resp: EmpleadoResponseDto) {
  const domicilio = {} as Record<keyof DomicilioEmpleadoDto, string | null>;
  for (const campo of DOMICILIO_CAMPOS) domicilio[campo] = resp.domicilio?.[campo] ?? null;

  const contactosEmergencia = (resp.contactosEmergencia ?? []).slice(0, CONTACTOS_EMERGENCIA_MAX).map((c) => ({
    nombre: c.nombre ?? null,
    parentesco: c.parentesco ?? null,
    telefono: c.telefono ?? null,
    correo: c.correo ?? null,
  }));

  const documentos = DOCUMENTOS.map((config) => {
    const guardado = (resp.documentos ?? []).find((doc) => doc.tipo === config.tipo);
    return {
      tipo: config.tipo,
      archivo: guardado?.archivo ?? null,
      archivoNuevo: null,
      fecha: parsearFechaApi(guardado?.fecha),
      fechaVigencia: parsearFechaApi(guardado?.fechaVigencia),
      mes: parsearMesApi(guardado?.mes),
      nivelEstudios: guardado?.nivelEstudios ?? null,
      banco: guardado?.banco ?? null,
      clabe: guardado?.clabe ?? null,
    };
  });

  return {
    nacionalidad: resp.nacionalidad ?? null,
    sexo: resp.sexo ?? null,
    estadoCivil: resp.estadoCivil ?? null,
    tipoSangre: resp.tipoSangre ?? null,
    domicilio,
    contactosEmergencia,
    documentos,
  };
}

/** Deja el FormArray de contactos con `cantidad` grupos vacíos, listos para patchValue. */
export function ajustarContactosEmergencia(contactos: FormArray<ContactoEmergenciaGrupo>, cantidad: number): void {
  contactos.clear();
  for (let i = 0; i < Math.min(cantidad, CONTACTOS_EMERGENCIA_MAX); i++) {
    contactos.push(contactoEmergenciaGrupo());
  }
}

/** Date (o 'yyyy-MM') -> 'yyyy-MM' con la fecha local. */
export function formatearMesApi(valor: Date | string | null | undefined): string | null {
  if (!valor) return null;
  if (typeof valor === 'string') {
    const match = /^(\d{4})-(\d{2})/.exec(valor);
    return match ? `${match[1]}-${match[2]}` : null;
  }
  if (!(valor instanceof Date) || isNaN(valor.getTime())) return null;
  return `${valor.getFullYear()}-${String(valor.getMonth() + 1).padStart(2, '0')}`;
}

/** 'yyyy-MM' (o 'yyyy-MM-dd') -> Date local del día 1 de ese mes. */
export function parsearMesApi(valor: string | null | undefined): Date | null {
  if (!valor) return null;
  const match = /^(\d{4})-(\d{2})/.exec(valor);
  if (!match) return null;
  return new Date(Number(match[1]), Number(match[2]) - 1, 1);
}
