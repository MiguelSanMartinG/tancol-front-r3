import { Injectable, signal } from '@angular/core';
import { RutasResponse } from './rutas.response';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { RutasDTO } from './rutas-dto';

@Injectable({ providedIn: 'root' })
export class RutasApiService {
listAll = signal<RutasResponse[]>([]);
endpoint:string = 'rutas'

  constructor(private http: HttpClient) {}

  getAll(): Observable<RutasResponse[]> {
    return this.http.get<RutasResponse[]>(this.endpoint).pipe(
      tap((resp) => {
        this.listAll.set(resp);
      })
    );
  }

  getOne(id:string){
    return this.http.get<RutasResponse>(this.endpoint+'/'+id).pipe(
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
      this.endpoint + params,
      {
        headers: headers,
      }
    );
  }
  create(body: RutasDTO) {
    return this.http.post<any>(this.endpoint, body).pipe(
      tap((resp) => {
        console.log(resp);
        // this.listAll.update((list) => [resp, ...list]);
      })
    );
  }
  update(body: RutasDTO, id: string) {
    return this.http.put<RutasResponse>(this.endpoint+'/' + id, body).pipe(
      tap((resp) => {
        this.listAll.update((list) => {
          const filter = list.filter((row) => row.id != id);
          return [resp, ...filter];
        });
      })
    );
  }
  delete(id: string) {
    return this.http.delete<RutasResponse>(this.endpoint+'/' + id).pipe(
      tap((resp) => {
        this.listAll.update((list) => {
          const filter = list.filter((row) => row.id != id);
          return [...filter];
        });
      })
    );
  }
}
