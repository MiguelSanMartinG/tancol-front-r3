import { Injectable, signal } from '@angular/core';
import { SalidaMaterialResponse } from './salida-material.response';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { SalidaMaterialDTO } from './salida-material.dto';

@Injectable({ providedIn: 'root' })
export class SalidaMaterialApiService {
  listAll = signal<SalidaMaterialResponse[]>([]);
  constructor(private http: HttpClient) {}

  getAll(): Observable<SalidaMaterialResponse[]> {
    return this.http.get<SalidaMaterialResponse[]>('orden-interna').pipe(
      tap((resp) => {
        this.listAll.set(resp);
      })
    );
  }

  getOne(id: string): Observable<SalidaMaterialResponse> {
    return this.http.get<SalidaMaterialResponse>('orden-interna/' + id);
  }

  getAllFilter(
    params = '',
    headers = {}
  ): Observable<SalidaMaterialResponse[]> {
    return this.http.get<SalidaMaterialResponse[]>(
      'orden-interna' + params,
      {
        headers: headers,
      }
    );
  }
  create(body: SalidaMaterialDTO) {
    return this.http.post<SalidaMaterialResponse>('orden-interna', body).pipe(
      tap((resp) => {
        this.listAll.update((list) => [resp, ...list]);
      })
    );
  }
  update(body: SalidaMaterialDTO, id: string) {
    return this.http.put<SalidaMaterialResponse>('orden-interna/' + id, body).pipe(
      tap((resp) => {
        this.listAll.update((list) => {
          const filter = list.filter((row) => row.idOrdenInterna != id);
          return [resp, ...filter];
        });
      })
    );
  }
  delete(id: string) {
    return this.http.delete<SalidaMaterialResponse>('orden-interna/' + id).pipe(
      tap((resp) => {
        this.listAll.update((list) => {
          const filter = list.filter((row) => row.idOrdenInterna != id);
          return [...filter];
        });
      })
    );
  }
}
