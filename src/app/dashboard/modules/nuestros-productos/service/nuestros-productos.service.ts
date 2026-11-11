import { Injectable, signal } from '@angular/core';
import { NuestrosProductosResponse } from './nuestros-productos.response';
import { NuestrosProductosDTO } from './nuestros-productos.DTO';
import { HttpClient } from '@angular/common/http';
import { tap, Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class NuestrosProductosService {
   listAll = signal<NuestrosProductosResponse[]>([]);
  constructor(private http: HttpClient) {}


  create(body: NuestrosProductosDTO) {
    return this.http.post<any>('producto-comercial', body).pipe(
      tap((resp) => {
        console.log(resp);
        this.listAll.update((list) => [resp, ...list]);
      })
    );
  }

  getAll(): Observable<NuestrosProductosResponse[]> {
    return this.http.get<NuestrosProductosResponse[]>('producto-comercial').pipe(
      tap((resp) => {
        this.listAll.set(resp);
      })
    );
  }

  getOne(id:string){
    return this.http.get<NuestrosProductosResponse>('producto-comercial/'+id).pipe(
      tap((resp) => {
        return resp;
      })
    );
  }




  getAllFilter(
    params = '',
    headers = {}
  ): Observable<NuestrosProductosResponse[]> {
    return this.http.get<NuestrosProductosResponse[]>(
      'producto-comercial' + params,
      {
        headers: headers,
      }
    ).pipe(
      tap((resp) => {
        this.listAll.set(resp);
      })
    );
  }

  update(body: NuestrosProductosDTO, id: string) {
    return this.http.put<NuestrosProductosResponse>('producto-comercial/' + id, body).pipe(
      tap((resp) => {
        this.listAll.update((list) => {
          const filter = list.filter((row) => row.idProductoComercial != id);
          return [resp, ...filter];
        });
      })
    );
  }
  delete(id: string) {
    return this.http.delete<NuestrosProductosResponse>('producto-comercial/' + id).pipe(
      tap((resp) => {
        this.listAll.update((list) => {
          const filter = list.filter((row) => row.idProductoComercial != id);
          return [...filter];
        });
      })
    );
  }
}
