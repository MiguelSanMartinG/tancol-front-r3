export interface VentaRutaResponse {
  bitacoraPartidaVentas: BitacoraPartidaVenta[];
  createdAt: string;
  fecha: string;
  folio: string;
  idBitacora: string;
  status: string;
  updatedAt: string;
  usuario: Empleado;
}

export interface BitacoraPartidaVenta {
  comisionesEmpleados: ComisionEmpleado[];
  cantidadLlegada: number;
  cantidadSalida: number;
  conductor: Empleado;
  huecos: number;
  idVenta: string;
  idPartida:string;
  fechaFirma?: string;
}

export interface Empleado {
  departamento: Departamento;
  enabled: boolean;
  idEmpleado: string;
  nombre: string;
  nombreUsuario: string;
  tipoEmpleado: TipoEmpleado;
}

export interface Departamento {
  alias: string;
  createdAt: string;
  descripcion: string;
  enabled: boolean;
  idDepartamento: string;
  nombre: string;
  updatedAt: string;
}

export interface ComisionEmpleado {
  id: string | null;
  empleado: Empleado;
  cantidadConsignada: number;
}

export interface TipoEmpleado {
  alias: string;
  createdAt: string;
  enabled: boolean;
  idTipoEmpleado: string;
  nombre: string;
  updatedAt: string;
}
