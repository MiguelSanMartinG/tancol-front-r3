import { HttpClient } from '@angular/common/http';
import { Injectable, signal } from '@angular/core';
import { TipoImpuestoCreateDto } from './dtos/tipo-impuesto.create.dto';
import { Observable, tap } from 'rxjs';
import { TipoImpuestoResponseDto } from './dtos/tipo-impuesto.response.dto';
import { TipoImpuestoUpdateDto } from './dtos/tipo-impuesto.update.dto';

@Injectable({
  providedIn: 'root',
})
export class TipoImpuestoApiService {
  listAll = signal<TipoImpuestoResponseDto[]>([]);
  constructor(private http: HttpClient) {}

  getAll(): Observable<TipoImpuestoResponseDto[]> {
    return this.http.get<TipoImpuestoResponseDto[]>('tipo-impuesto').pipe(
      tap((resp) => {
        this.listAll.set(resp);
      })
    );
  }
  getAllFilter(
    params = '',
    headers = {}
  ): Observable<TipoImpuestoResponseDto[]> {
    return this.http.get<TipoImpuestoResponseDto[]>(
      'tipo-impuesto' + params,
      {
        headers: headers,
      }
    ).pipe(
      tap((resp)=>{
        this.listAll.set(resp);
      })
    );
  }
  create(body: TipoImpuestoCreateDto) {
    return this.http.post<TipoImpuestoResponseDto>('tipo-impuesto', body).pipe(
      tap((resp) => {
        this.listAll.update((list) => [resp, ...list]);
      })
    );
  }
  update(body: TipoImpuestoUpdateDto, id: string) {
    return this.http.put<TipoImpuestoResponseDto>('tipo-impuesto/' + id, body).pipe(
      tap((resp) => {
        this.listAll.update((list) => {
          const filter = list.filter((row) => row.id != id);
          return [resp, ...filter];
        });
      })
    );
  }
  delete(id: string) {
    return this.http.delete<TipoImpuestoResponseDto>('tipo-impuesto' + id).pipe(
      tap((resp) => {
        this.listAll.update((list) => {
          const filter = list.filter((row) => row.id != id);
          return [...filter];
        });
      })
    );
  }
}
