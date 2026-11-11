import { HttpClient } from '@angular/common/http';
import { Injectable, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { EquipoDto } from './equipo.dto';
import { EquipoResponse } from './equipo.response';

@Injectable({ providedIn: 'root' })
export class EquipoApiService {
  listAll = signal<EquipoResponse[]>([]);

  constructor(private http: HttpClient) {}

  getAll(params = ''): Observable<EquipoResponse[]> {
    return this.http.get<EquipoResponse[]>(`equipo${params}`).pipe(
      tap(response => this.listAll.set(response))
    );
  }

  getOne(id: string) {
    return this.http.get<EquipoResponse>(`equipo/${id}`);
  }

  create(body: EquipoDto) {
    return this.http.post<EquipoResponse>('equipo', body).pipe(
      tap(response => this.listAll.update(list => [response, ...list]))
    );
  }

  update(body: EquipoDto, id: string) {
    return this.http.put<EquipoResponse>(`equipo/${id}`, body).pipe(
      tap(response => this.listAll.update(list => [response, ...list.filter(row => row.id !== id)]))
    );
  }

  delete(id: string) {
    return this.http.delete<EquipoResponse>(`equipo/${id}`).pipe(
      tap(() => this.listAll.update(list => list.filter(row => row.id !== id)))
    );
  }
}
