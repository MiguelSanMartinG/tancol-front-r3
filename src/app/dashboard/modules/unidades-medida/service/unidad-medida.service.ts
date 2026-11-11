import { Injectable, signal } from '@angular/core';
import { UnidadMedidaResponse } from './unidad-medida.response';
import { HttpClient } from '@angular/common/http';
import { UnidadMedidaDTO } from './unidad-medida.dto';
import { Observable, tap } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class UnidadMedidaService {
   listAll = signal<UnidadMedidaResponse[]>([]);
  constructor(private http: HttpClient) {}


  create(body: UnidadMedidaDTO) {
    return this.http.post<any>('unidad-medida', body).pipe(
      tap((resp) => {
        console.log(resp);
        this.listAll.update((list) => [resp, ...list]);
      })
    );
  }

  getAll(): Observable<UnidadMedidaResponse[]> {
    return this.http.get<UnidadMedidaResponse[]>('unidad-medida').pipe(
      tap((resp) => {
        this.listAll.set(resp);
      })
    );
  }

  getOne(id:string){
    return this.http.get<UnidadMedidaResponse>('unidad-medida/'+id).pipe(
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
      'unidad-medida' + params,
      {
        headers: headers,
      }
    ).pipe(
      tap((resp) => {
        this.listAll.set(resp);
      })
    );
  }

  update(body: UnidadMedidaDTO, id: string) {
    return this.http.put<UnidadMedidaResponse>('unidad-medida/' + id, body).pipe(
      tap((resp) => {
        this.listAll.update((list) => {
          const filter = list.filter((row) => row.idUnidadDeMedida != id);
          return [resp, ...filter];
        });
      })
    );
  }
  delete(id: string) {
    return this.http.delete<UnidadMedidaResponse>('unidad-medida/' + id).pipe(
      tap((resp) => {
        this.listAll.update((list) => {
          const filter = list.filter((row) => row.idUnidadDeMedida != id);
          return [...filter];
        });
      })
    );
  }
}
