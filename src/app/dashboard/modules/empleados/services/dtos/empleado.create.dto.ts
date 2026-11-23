export type TipoContratacion = 'PLANTA' | 'TEMPORAL' | 'PRACTICANTE';

export const TIPOS_CONTRATACION: { value: TipoContratacion; label: string }[] = [
    { value: 'PLANTA', label: 'De planta' },
    { value: 'TEMPORAL', label: 'Temporal' },
    { value: 'PRACTICANTE', label: 'Practicante' },
];

/** Tipos de contratación que requieren fecha de vigencia. */
export const TIPOS_CONTRATACION_CON_VIGENCIA: readonly TipoContratacion[] = ['TEMPORAL', 'PRACTICANTE'];

export function requiereVigencia(tipo: TipoContratacion | string | null | undefined): boolean {
    return !!tipo && (TIPOS_CONTRATACION_CON_VIGENCIA as readonly string[]).includes(tipo);
}

export function etiquetaTipoContratacion(tipo: TipoContratacion | string | null | undefined): string {
    if (!tipo) return '';
    return TIPOS_CONTRATACION.find((item) => item.value === tipo)?.label ?? tipo;
}

export interface EmpleadoDto{
    apellidoMaterno: string;
    apellidoPaterno: string;
    correo: string;
    enabled: boolean;
    fechaNacimiento: string;
    idDepartamento: string;
    idRol: number;
    idTipoEmpleado: string;
    nombre: string;
    password?: string;
    telefono: string;
    // Datos laborales
    nss: string | null;
    rfc: string | null;
    curp: string | null;
    /** 'yyyy-MM-dd' */
    fechaIngreso: string | null;
    /** 'yyyy-MM-dd' */
    fechaEgreso: string | null;
    observaciones: string | null;
    tipoContratacion: TipoContratacion | null;
    /** 'yyyy-MM-dd'; obligatoria si tipoContratacion es TEMPORAL o PRACTICANTE */
    fechaVigencia: string | null;
    // Datos de RH
    nacionalidad?: Nacionalidad | null;
    sexo?: Sexo | null;
    estadoCivil?: EstadoCivil | null;
    tipoSangre?: TipoSangre | null;
    domicilio?: DomicilioEmpleadoDto | null;
    /** Lista completa: en el PUT reemplaza a la guardada. */
    /** Si no se envía (undefined), el back conserva los guardados. */
    contactosEmergencia?: ContactoEmergenciaDto[];
    /** Lista completa: en el PUT reemplaza a la guardada. Solo documentos con archivo. */
    documentos?: DocumentoEmpleadoDto[];
}

// ===================== Datos de RH =====================

export type Nacionalidad = 'MEXICANA' | 'EXTRANJERA';
export type Sexo = 'MASCULINO' | 'FEMENINO' | 'NO_ESPECIFICADO';
export type EstadoCivil = 'SOLTERO' | 'CASADO' | 'DIVORCIADO' | 'VIUDO' | 'UNION_LIBRE';
export type TipoSangre = 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';
export type NivelEstudios =
    | 'PRIMARIA'
    | 'SECUNDARIA'
    | 'PREPARATORIA'
    | 'UNIVERSIDAD'
    | 'POSGRADO'
    | 'MAESTRIA'
    | 'DOCTORADO';
export type TipoDocumentoEmpleado =
    | 'INE'
    | 'ACTA_NACIMIENTO'
    | 'CURP'
    | 'CONSTANCIA_SITUACION_FISCAL'
    | 'COMPROBANTE_DOMICILIO'
    | 'IMSS'
    | 'CARATULA_BANCARIA'
    | 'COMPROBANTE_ESTUDIOS'
    | 'EXPERIENCIA_LABORAL'
    | 'CONTRATO'
    | 'LICENCIA_CONDUCIR'
    | 'ANTECEDENTES_NO_PENALES';

export interface DomicilioEmpleadoDto {
    codigoPostal: string | null;
    tipoVialidad: string | null;
    nombreVialidad: string | null;
    numeroExterior: string | null;
    numeroInterior: string | null;
    colonia: string | null;
    localidad: string | null;
    municipio: string | null;
    entidadFederativa: string | null;
    calle1: string | null;
    calle2: string | null;
}

export interface ContactoEmergenciaDto {
    nombre: string | null;
    parentesco: string | null;
    telefono: string | null;
    correo: string | null;
}

export interface DocumentoEmpleadoDto {
    tipo: TipoDocumentoEmpleado;
    /** Nombre guardado que regresa `POST empleados/documentos/archivo`. */
    archivo: string;
    /** 'yyyy-MM-dd' */
    fecha: string | null;
    /** 'yyyy-MM-dd' */
    fechaVigencia: string | null;
    /** 'yyyy-MM' */
    mes: string | null;
    nivelEstudios: NivelEstudios | null;
    banco: string | null;
    clabe: string | null;
}

/** Respuesta de `POST empleados/documentos/archivo`. */
export interface ArchivoDocumentoResponse {
    fileName: string;
}
