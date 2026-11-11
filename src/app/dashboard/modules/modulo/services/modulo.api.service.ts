import { HttpClient } from '@angular/common/http';
import { Injectable, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { ModuloCreateDto } from './dtos/modulo.create.dto';
import { ModuloResponseDto } from './dtos/modulo.response.dto';

@Injectable({ providedIn: 'root' })
export class ModuloApiService {
  listAll = signal<ModuloResponseDto[]>([]);
  constructor(private http: HttpClient) {}

  getAll(): Observable<ModuloResponseDto[]> {
    return this.http.get<ModuloResponseDto[]>('modulo').pipe(
      tap((resp) => this.listAll.set(resp))
    );
  }

  getOne(id: string) {
    return this.http.get<ModuloResponseDto>('modulo/' + id);
  }

  create(body: ModuloCreateDto) {
    return this.http.post<ModuloResponseDto>('modulo', body).pipe(
      tap((resp) => this.listAll.update((list) => [resp, ...list]))
    );
  }

  update(body: ModuloCreateDto, id: string) {
    return this.http.put<ModuloResponseDto>('modulo/' + id, body).pipe(
      tap((resp) => {
        this.listAll.update((list) => {
          const filter = list.filter((row) => row.idModulo !== id);
          return [resp, ...filter];
        });
      })
    );
  }

  delete(id: string) {
    return this.http.delete<ModuloResponseDto>('modulo/' + id).pipe(
      tap(() => this.listAll.update((list) => list.filter((row) => row.idModulo !== id)))
    );
  }
}
