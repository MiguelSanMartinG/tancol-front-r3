export interface EquipoResponse {
  id: string;
  nombre: string;
  sku: string;
  idImagen: string;
  descripcion: string;
  marca: string;
  modelo: string;
  estado: 'DISPONIBLE' | 'ASIGNADO' | 'BAJA' | string;
  tipoEquipo: {
    id: string;
    nombre: string;
    alias: string;
    enabled: boolean;
  };
  createdAt: string;
  updatedAt: string;
  enabled: boolean;
  clienteAsignado: {
    idCliente: string;
    nombreComercial: string;
    tipoDeCliente?: {
      idTipoCliente?: string;
      nombre?: string;
      alias?: string;
    } | null;
    enabled: boolean;
  } | null;
}
