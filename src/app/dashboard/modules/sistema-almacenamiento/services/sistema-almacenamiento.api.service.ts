import { HttpClient } from '@angular/common/http';
import { Injectable, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { SistemaAlmacenamientoCreateDto } from './dtos/sistema-almacenamiento.create.dto';
import { SistemaAlmacenamientoResponseDto } from './dtos/sistema-almacenamiento.response.dto';

@Injectable({
  providedIn: 'root',
})
export class SistemaAlmacenamientoApiService {
  listAll = signal<SistemaAlmacenamientoResponseDto[]>([]);
  constructor(private http: HttpClient) {}

  getAll(): Observable<SistemaAlmacenamientoResponseDto[]> {
    return this.http
      .get<SistemaAlmacenamientoResponseDto[]>('sistemas-almacenamiento')
      .pipe(
        tap((resp) => {
          this.listAll.set(resp);
        })
      );
  }

  getOne(id: string) {
    return this.http
      .get<SistemaAlmacenamientoResponseDto>('sistemas-almacenamiento/' + id)
      .pipe(
        tap((resp) => {
          return resp;
        })
      );
  }

  getAllFilter(params = '', headers = {}): Observable<any[]> {
    return this.http.get<any[]>(
      'sistemas-almacenamiento' + params,
      {
        headers: headers,
      }
    );
  }

  create(body: SistemaAlmacenamientoCreateDto) {
    return this.http
      .post<any>('sistemas-almacenamiento', body)
      .pipe(
        tap((resp) => {
          console.log(resp);
        })
      );
  }

  update(body: SistemaAlmacenamientoCreateDto, id: string) {
    return this.http
      .put<SistemaAlmacenamientoResponseDto>(
        'sistemas-almacenamiento/' + id,
        body
      )
      .pipe(
        tap((resp) => {
          this.listAll.update((list) => {
            const filter = list.filter((row) => row.id != id);
            return [resp, ...filter];
          });
        })
      );
  }

  delete(id: string) {
    return this.http
      .delete<SistemaAlmacenamientoResponseDto>(
        'sistemas-almacenamiento/' + id
      )
      .pipe(
        tap((resp) => {
          this.listAll.update((list) => {
            const filter = list.filter((row) => row.id != id);
            return [...filter];
          });
        })
      );
  }
}
