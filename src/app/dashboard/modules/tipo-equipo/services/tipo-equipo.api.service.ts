import { HttpClient } from '@angular/common/http';
import { Injectable, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { TipoEquipoDto } from './tipo-equipo.dto';
import { TipoEquipoResponse } from './tipo-equipo.response';

@Injectable({ providedIn: 'root' })
export class TipoEquipoApiService {
  listAll = signal<TipoEquipoResponse[]>([]);

  constructor(private http: HttpClient) {}

  getAll(): Observable<TipoEquipoResponse[]> {
    return this.http.get<TipoEquipoResponse[]>('tipo-equipo').pipe(
      tap(response => this.listAll.set(response))
    );
  }

  getOne(id: string) {
    return this.http.get<TipoEquipoResponse>(`tipo-equipo/${id}`);
  }

  create(body: TipoEquipoDto) {
    return this.http.post<TipoEquipoResponse>('tipo-equipo', body).pipe(
      tap(response => this.listAll.update(list => [response, ...list]))
    );
  }

  update(body: TipoEquipoDto, id: string) {
    return this.http.put<TipoEquipoResponse>(`tipo-equipo/${id}`, body).pipe(
      tap(response => this.listAll.update(list => [response, ...list.filter(row => row.id !== id)]))
    );
  }

  delete(id: string) {
    return this.http.delete<TipoEquipoResponse>(`tipo-equipo/${id}`).pipe(
      tap(() => this.listAll.update(list => list.filter(row => row.id !== id)))
    );
  }
}
