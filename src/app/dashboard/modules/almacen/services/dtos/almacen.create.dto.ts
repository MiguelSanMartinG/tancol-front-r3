export interface AlmacenCreateDto{
    nombre: string;
    /** Empleado responsable del almacén (null = sin responsable). */
    idResponsable?: string | null;
}