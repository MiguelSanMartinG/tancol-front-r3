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
}
