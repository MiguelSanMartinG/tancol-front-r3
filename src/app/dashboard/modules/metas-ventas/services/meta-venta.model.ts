export interface MetaVenta {
  id: string;
  empleadoId: string;
  empleadoNombre: string | null;
  productoId: string;
  productoNombre: string | null;
  productoAlias: string | null;
  cantidadMinima: number;
  periodo: 'SEMANAL' | string;
  activa: boolean;
  fechaInicio: string;
  fechaCierre: string | null;
  createdAt: string;
  updatedAt: string;
  enabled: boolean;
}

export interface MetaVentaRequest {
  idEmpleado: string;
  idProducto: string;
  cantidadMinima: number;
}

export interface MetaVentaNoCubierta {
  metaId: string;
  empleadoId: string;
  empleadoNombre: string | null;
  productoId: string;
  productoNombre: string | null;
  productoAlias: string | null;
  cantidadMinima: number;
  cantidadVendida: number;
  cubierto: false;
  periodoInicio: string;
  periodoFin: string;
}

export interface MetaVentaRevision {
  periodoInicio: string;
  periodoFin: string;
  ejecutadoEn: string;
  totalEvaluadas: number;
  totalNoCubiertas: number;
  destinatariosEncontrados: number;
  notificacionesGeneradas: number;
  noCubiertas: MetaVentaNoCubierta[];
}
