import { HttpClient } from '@angular/common/http';
import { Injectable, signal } from '@angular/core';
import { tap, Observable } from 'rxjs';
import { TipoClienteResponse } from './tipo-cliente-response';
import { TipoClienteDto } from './tipo-cliente-dto';

@Injectable({ providedIn: 'root' })
export class TipoClienteApiService {
   listAll = signal<TipoClienteResponse[]>([]);
  constructor(private http: HttpClient) {}


  create(body: TipoClienteDto) {
    return this.http.post<any>('tipo-cliente', body).pipe(
      tap((resp) => {
        console.log(resp);
        this.listAll.update((list) => [resp, ...list]);
      })
    );
  }

  getAll(): Observable<TipoClienteResponse[]> {
    return this.http.get<TipoClienteResponse[]>('tipo-cliente').pipe(
      tap((resp) => {
        console.log(resp);
        this.listAll.set(resp);
      })
    );
  }

  getOne(id:string){
    return this.http.get<TipoClienteResponse>('tipo-cliente/'+id).pipe(
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
      'tipo-cliente' + params,
      {
        headers: headers,
      }
    );
  }

  update(body: TipoClienteDto, id: string) {
    return this.http.put<TipoClienteResponse>('tipo-cliente/' + id, body).pipe(
      tap((resp) => {
        this.listAll.update((list) => {
          const filter = list.filter((row) => row.idTiposClientes != id);
          return [resp, ...filter];
        });
      })
    );
  }
  delete(id: string) {
    return this.http.delete<TipoClienteResponse>('tipo-cliente/' + id).pipe(
      tap((resp) => {
        this.listAll.update((list) => {
          const filter = list.filter((row) => row.idTiposClientes != id);
          return [...filter];
        });
      })
    );
  }
}
