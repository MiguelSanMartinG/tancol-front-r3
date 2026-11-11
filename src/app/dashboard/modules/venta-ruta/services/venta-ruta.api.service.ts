import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { ComisionEmpleado, Empleado, VentaRutaResponse } from './venta-ruta.response';
import { VentaRutaDTO } from './venta-ruta.dto';
import { FueraEspecificacionResponse } from '../../fuera-especificacion/services/fuera-especificacion-response';
import { ProductosFueraEspecificacion } from './viaje-dto';

@Injectable({ providedIn: 'root' })
export class VentaRutaApiService {
  listAll = signal<VentaRutaResponse[]>([]);
  url:string = 'bitacoras-rutas'

  constructor(private http: HttpClient) {}

  check(date:string):Observable<BitacoraRutaResponse>{
    return this.http.get<BitacoraRutaResponse>(`${this.url}/fecha/${date}`);
  }

  getAll(): Observable<VentaRutaResponse[]> {
    return this.http.get<VentaRutaResponse[]>(this.url).pipe(
      tap((resp) => {
        this.listAll.set(resp);
      })
    );
  }

  getOne(id: string) {
    return this.http.get<VentaRutaResponse>(this.url+'/' + id).pipe(
      tap((resp) => resp)
    );
  }

  getAllFilter(params = '', headers = {}): Observable<any[]> {
    return this.http.get<any[]>('venta-ruta' + params, {
      headers: headers,
    });
  }

  create(body: {fecha:string}) {
    return this.http.post<BitacoraRutaResponse>(this.url, body).pipe(
      tap((resp) => {
        console.log(resp);
      })
    );
  }

  update(body: VentaRutaDTO, id: string) {
    return this.http.put<VentaRutaResponse>(this.url+'/' + id, body).pipe(
      tap((resp) => {
        this.listAll.update((list) => {
          const filter = list.filter((row) => row.idBitacora != id);
          return [resp, ...filter];
        });
      })
    );
  }

  delete(id: string) {
    return this.http.delete<VentaRutaResponse>('venta-ruta/' + id).pipe(
      tap(() => {
        this.listAll.update((list) => {
          const filter = list.filter((row) => row.idBitacora != id);
          return [...filter];
        });
      })
    );
  }
}


export interface BitacoraRutaResponse {
  idBitacora: string;
  status: string;
  folio: string;
  fecha: string;
  usuario?: any;
  createdAt: string;
  updatedAt: string;
  bitacoraPartidaVentas: BitacoraPartidaVenta[];
}

export interface BitacoraPartidaVenta {
  idPartida: string;
  ruta: Ruta;
  tipoProceso:string;
  conductor: Conductor;
  vehiculo: VehiculosBase;
  idImagenFirma: string;
  estadoVentaRuta: string;
  fechaFirma?: string;
  mandadoALiquidacion?: any;
  createdAt: string;
  updatedAt: string;
  comentario: string;
  ventaTrayecto: VentaTrayecto[];
}

export interface VentaTrayecto {
  idVenta: string;
  producto: ProductoBase;
  cantidad?: any;
  unidades: UnidadMedidaDefault;
  cantidadSalida: number;
  cantidadLlegada: number;
  huecos?: any;
  mermas: MermaResponse[];
  createdAt: string;
  updatedAt: string;
  productosFueraEspecificacion: ProductosFueraEspecificacionResponse[];
  comisionesEmpleados: ComisionEmpleadoResponse[];
}

export interface MermaResponse {
  idMerma?: string;
  empleadoResponsable?: {
    idEmpleado: string;
    nombre?: string;
    apellidoPaterno?: string;
    apellidoMaterno?: string;
  } | null;
  cantidad: number;
  rotoPorMaquina: boolean;
  idImagenFirma: string | null;
}

export interface ProductosFueraEspecificacionResponse{
    idPFE: string;
  concepto: Concepto;
  cantidad: number;
}

export interface Concepto {
  id: number;
  tipoRezago: string;
  motivo: string;
  enabled: boolean;
  createdAt?: any;
  updatedAt: string;
}

export interface ComisionEmpleadoResponse{
   empleado: Empleado;
  comision: number;
}

export interface Conductor {
  idEmpleado: string;
  role?: any;
  nombre: string;
  apellidoPaterno: string;
  apellidoMaterno: string;
  email: string;
  fechaNacimiento: string;
  telefono: string;
  createdAt: string;
  updatedAt: string;
  enabled: boolean;
  nombreUsuario: string;
  departamento: Departamento;
  tipoEmpleado: TipoEmpleado;
}

export interface Ruta {
  id: string;
  nombre: string;
  numero: string;
  notaAsignada: string;
  choferBase: ChoferBase;
  productoBase: ProductoBase;
  vehiculosBase: VehiculosBase;
  empleadosAsignados: ChoferBase[];
  enabled: boolean;
  cratedAt: string;
  updatedAt: string;
}

export interface VehiculosBase {
  id: string;
  nombre: string;
  placas: string;
  capacidadMaxima: number;
  unidadMedida: UnidadMedidaDefault;
  numeroPoliza: string;
  vigenciaPoliza: string;
  documentoPoliza: string;
  status: string;
  descripcion: string;
  cratedAt: string;
  updatedAt: string;
  enabled: boolean;
}

export interface ProductoBase {
  idProductoComercial: string;
  categoriaProductoComercial: CategoriaProductoComercial;
  nombre: string;
  alias: string;
  descripcion: string;
  idImagen: string;
  precio: number;
  sku: string;
  createdAt: string;
  updatedAt: string;
  unidadMedidaDefault: UnidadMedidaDefault;
  enabled: boolean;
}

export interface UnidadMedidaDefault {
  idUnidadDeMedida: string;
  nombre: string;
  alias: string;
  updatedAt: string;
  createdAt: string;
}

export interface CategoriaProductoComercial {
  idCategoriaComercial: string;
  nombre: string;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ChoferBase {
  idEmpleado: string;
  nombre: string;
  enabled: boolean;
  nombreUsuario: string;
  departamento: Departamento;
  tipoEmpleado: TipoEmpleado;
}

export interface TipoEmpleado {
  idTipoEmpleado: string;
  nombre: string;
  alias: string;
  createdAt: string;
  updatedAt: string;
  enabled: boolean;
}

export interface Departamento {
  createdAt: string;
  updatedAt: string;
  enabled: boolean;
  idDepartamento: string;
  nombre: string;
  alias: string;
  descripcion: string;
}
