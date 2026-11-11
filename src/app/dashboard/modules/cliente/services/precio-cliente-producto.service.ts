import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';



@Injectable({ providedIn: 'root' })
export class PrecioClienteProductoService {
   listAll = signal<PrecioClienteResponse[]>([]);
  constructor(private http: HttpClient) {}


  create(body: PrecioClienteDTO[]) {
    return this.http.post<any>('precio-cliente', body).pipe(
      tap((resp) => {
        console.log(resp);
        this.listAll.update((list) => [resp, ...list]);
      })
    );
  }

  getAll(): Observable<PrecioClienteResponse[]> {
    return this.http.get<PrecioClienteResponse[]>('precio-cliente').pipe(
      tap((resp) => {
        this.listAll.set(resp);
      })
    );
  }

  getOne(id:string){
    return this.http.get<PrecioClienteResponse>('precio-cliente/'+id).pipe(
      tap((resp) => {
        return resp;
      })
    );
  }




  getAllFilter(
    params = '',
    headers = {}
  ): Observable<any[]> {
    return this.http.get<any[]>(
      'precio-cliente' + params,
      {
        headers: headers,
      }
    );
  }

  update(body: PrecioClienteDTO[], id: string) {
    return this.http.put<PrecioClienteResponse>('precio-cliente/' + id, body).pipe(
      tap((resp) => {
        this.listAll.update((list) => {
          const filter = list.filter((row) => row.idPrecio != id);
          return [resp, ...filter];
        });
      })
    );
  }
  delete(id: string) {
    return this.http.delete<PrecioClienteResponse>('precio-cliente/' + id).pipe(
      tap((resp) => {
        this.listAll.update((list) => {
          const filter = list.filter((row) => row.idPrecio != id);
          return [...filter];
        });
      })
    );
  }
}

export interface PrecioClienteDTO{
  descuento:number;
  idPrecioCliente:string | null;
  idProducto:string;
}

export interface PrecioClienteResponse{
  cliente: Cliente;
  descuento: number;
  idPrecio: string;
  producto: Producto;
}

export interface Producto {
  idProductoComercial: string;
  nombre: string;
  precio: number;
}

export interface Cliente {
  enabled: boolean;
  idCliente: string;
  nombreComercial: string;
  tipoDeCliente: TipoDeCliente;
}

export interface TipoDeCliente {
  alias: string;
  enabled: boolean;
  idTipoCliente: string;
  nombre: string;
}