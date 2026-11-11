import { HttpClient, HttpContext } from '@angular/common/http';
import { Injectable, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { BitacoraPartidaVenta } from './venta-ruta.response';
import { SKIP_LOADING } from '@core/auth.interceptor';

@Injectable({
  providedIn: 'root'
})
export class PartidaBitacoraRutaService {

  listAll = signal<BitacoraPartidaVenta[]>([]);
  url:string = 'ventas-rutas'

  constructor(private http: HttpClient) {}

  check(date:string):Observable<BitacoraPartidaVenta>{
    return this.http.get<BitacoraPartidaVenta>(`${this.url}/fecha/${date}`);
  }

  getAll(): Observable<BitacoraPartidaVenta[]> {
    return this.http.get<BitacoraPartidaVenta[]>(`${this.url}`).pipe(
      tap((resp) => {
        this.listAll.set(resp);
      })
    );
  }

  getOne(id: string) {
    return this.http.get<BitacoraPartidaVenta>(`${this.url}/` + id).pipe(
      tap((resp) => resp)
    );
  }

  getAllFilter(params = '', headers = {}): Observable<any[]> {
    return this.http.get<any[]>(`${this.url}` + params, {
      headers: headers,
    });
  }

  create(body: PartidaBitacoraDTO) {
    return this.http.post<BitacoraPartidaVenta>(this.url, body).pipe(
      tap((resp) => {
        console.log(resp);
      })
    );
  }

  update(body: PartidaBitacoraDTO, id: string,  skipLoading = false) {
    return this.http.put<BitacoraPartidaVenta>(this.url+'/' + id, body,{context: new HttpContext().set(SKIP_LOADING, skipLoading),}).pipe(
      tap((resp) => {
        this.listAll.update((list) => {
          const filter = list.filter((row) => row.idVenta != id);
          return [resp, ...filter];
        });
      })
    );
  }

  delete(id: string) {
    return this.http.delete<BitacoraPartidaVenta>(`${this.url}/` + id).pipe(
      tap(() => {
        this.listAll.update((list) => {
          const filter = list.filter((row) => row.idVenta != id);
          return [...filter];
        });
      })
    );
  }
}

export interface PartidaBitacoraDTO{
    cantidadLlegada: number;
  cantidadSalida: number;
  comentario: string;
  comisionesEmpleados: ComisionesEmpleado[];
  donados: number;
  estadoVentaRuta: string;
  huecos: number;
  idBitacora: string;
  idConductor: string;
  idImagenFirma: string;
  idProductoComercial: string | null;
  idRuta: string;
  idVehiculo: string | null;
  rotos: number;
  productosNoConsignados:ProductosNoConsignados[]
}

export interface ComisionesEmpleado {
  cantidad: number;
  idEmpleado: string;
}

export interface ProductosNoConsignados{
  cantidad:number;
  idConcepto:any;
  idProductoRemanente:any;
}