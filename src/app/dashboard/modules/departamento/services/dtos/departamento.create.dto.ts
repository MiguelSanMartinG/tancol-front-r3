export interface DepartamentoCreateDto{
    nombre: string;
    alias:string;
    descripcion:string;
    /** Almacén asignado (null = sin almacén). */
    idAlmacen?: string | null;
}