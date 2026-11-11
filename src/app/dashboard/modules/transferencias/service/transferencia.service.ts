import { Injectable, signal } from '@angular/core';
import { TransferenciaResponse } from './transferencia.response';
import { HttpClient } from '@angular/common/http';
import { TransferenciaDTO } from './transferencia.dto';
import { Observable, tap } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class TransferenciaService {
   listAll = signal<TransferenciaResponse[]>([]);
  constructor(private http: HttpClient) {}


  create(body: TransferenciaDTO) {
    return this.http.post<any>('transferencias', body).pipe(
      tap((resp) => {
        console.log(resp);
        this.listAll.update((list) => [resp, ...list]);
      })
    );
  }

  getAll(): Observable<TransferenciaResponse[]> {
    return this.http.get<TransferenciaResponse[]>('transferencias').pipe(
      tap((resp) => {
        this.listAll.set(resp);
      })
    );
  }

  getOne(id:string){
    return this.http.get<TransferenciaResponse>('transferencias/'+id).pipe(
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
      'cliente' + params,
      {
        headers: headers,
      }
    );
  }

  update(body: TransferenciaDTO, id: string) {
    return this.http.put<TransferenciaResponse>('cliente/' + id, body).pipe(
      tap((resp) => {
        this.listAll.update((list) => {
          const filter = list.filter((row) => row.idTransferencia != id);
          return [resp, ...filter];
        });
      })
    );
  }
  delete(id: string) {
    return this.http.delete<TransferenciaResponse>('cliente/' + id).pipe(
      tap((resp) => {
        this.listAll.update((list) => {
          const filter = list.filter((row) => row.idTransferencia != id);
          return [...filter];
        });
      })
    );
  }
}
