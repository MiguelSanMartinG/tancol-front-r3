import { HttpClient } from '@angular/common/http';
import { Injectable, signal } from '@angular/core';
import { tap, Observable } from 'rxjs';
import { RolCreateDto } from './dtos/rol.create.dto';
import { RolResponseDto } from './dtos/rol.response.dto';

@Injectable({ providedIn: 'root' })
export class RolApiService {
  listAll = signal<RolResponseDto[]>([]);
  constructor(private http: HttpClient) {}

  create(body: RolCreateDto) {
    return this.http.post<RolResponseDto>('rol', body).pipe(
      tap((resp) => {
        this.listAll.update((list) => [resp, ...list]);
      })
    );
  }

  getAll(): Observable<RolResponseDto[]> {
    return this.http.get<RolResponseDto[]>('rol').pipe(
      tap((resp) => {
        this.listAll.set(resp);
      })
    );
  }

  getOne(id: string) {
    return this.http.get<RolResponseDto>('rol/' + id);
  }

  getAllFilter(params = '', headers = {}): Observable<RolResponseDto[]> {
    return this.http.get<RolResponseDto[]>('rol' + params, { headers: headers });
  }

  update(body: RolCreateDto, id: any) {
    return this.http.put<RolResponseDto>('rol/' + id, body).pipe(
      tap((resp) => {
        this.listAll.update((list) => {
          const filter = list.filter((row) => row.id != +id);
          return [resp, ...filter];
        });
      })
    );
  }

  delete(id: string) {
    return this.http.delete<RolResponseDto>('rol/' + id).pipe(
      tap(() => {
        this.listAll.update((list) => list.filter((row) => row.id != +id));
      })
    );
  }
}
