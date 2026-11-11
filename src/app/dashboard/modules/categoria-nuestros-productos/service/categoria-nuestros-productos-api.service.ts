import { Injectable, signal } from '@angular/core';
import { CategoriaNuestrosProductosResponse } from './categoria-nuestros-productos.response';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { CategoriaNuestrosProductosDTO } from './categoria-nuestros-productos.dto';

@Injectable({ providedIn: 'root' })
export class CategoriaNuestrosProductosApiService {
   listAll = signal<CategoriaNuestrosProductosResponse[]>([]);
  constructor(private http: HttpClient) {}


  create(body: CategoriaNuestrosProductosDTO) {
    return this.http.post<any>('categoria-producto-comerciales', body).pipe(
      tap((resp) => {
        console.log(resp);
        this.listAll.update((list) => [resp, ...list]);
      })
    );
  }

  getAll(): Observable<CategoriaNuestrosProductosResponse[]> {
    return this.http.get<CategoriaNuestrosProductosResponse[]>('categoria-producto-comerciales').pipe(
      tap((resp) => {
        this.listAll.set(resp);
      })
    );
  }

  getOne(id:string){
    return this.http.get<CategoriaNuestrosProductosResponse>('categoria-producto-comerciales/'+id).pipe(
      tap((resp) => {
        return resp;
      })
    );
  }




  getAllFilter(
    params = '',
    headers = {}
  ): Observable<any[]> {
    return this.http.get<CategoriaNuestrosProductosResponse[]>(
      'categoria-producto-comerciales' + params,
      {
        headers: headers,
      }
    ).pipe(
      tap((resp) => {
        console.log(resp);
        this.listAll.set(resp);
      })
    );
  }

  update(body: CategoriaNuestrosProductosDTO, id: string) {
    return this.http.put<CategoriaNuestrosProductosResponse>('categoria-producto-comerciales/' + id, body).pipe(
      tap((resp) => {
        this.listAll.update((list) => {
          const filter = list.filter((row) => row.idCategoriaComercial != id);
          return [resp, ...filter];
        });
      })
    );
  }
  delete(id: string) {
    return this.http.delete<CategoriaNuestrosProductosResponse>('categoria-producto-comerciales/' + id).pipe(
      tap((resp) => {
        this.listAll.update((list) => {
          const filter = list.filter((row) => row.idCategoriaComercial != id);
          return [...filter];
        });
      })
    );
  }
}
