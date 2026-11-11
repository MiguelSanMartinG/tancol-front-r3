import { HttpClient } from '@angular/common/http';
import { Injectable, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { ConceptoVentaCreateDto } from './dtos/concepto-venta.create.dto';
import { ConceptoVentaResponseDto } from './dtos/concepto-venta.response.dto';
import { ConceptoVentaUpdateDto } from './dtos/concepto-venta.update.dto';

@Injectable({
  providedIn: 'root',
})
export class ConceptoVentaApiService {
  listAll = signal<ConceptoVentaResponseDto[]>([]);
  constructor(private http: HttpClient) {}

  getAll(): Observable<ConceptoVentaResponseDto[]> {
    return this.http.get<ConceptoVentaResponseDto[]>('conceptos-ventas').pipe(
      tap((resp) => {
        this.listAll.set(resp);
      })
    );
  }

  getOne(id: string) {
    return this.http.get<ConceptoVentaResponseDto>('conceptos-ventas/' + id);
  }

  getAllFilter(params = '', headers = {}): Observable<ConceptoVentaResponseDto[]> {
    return this.http.get<ConceptoVentaResponseDto[]>(
      'conceptos-ventas' + params,
      { headers }
    );
  }

  create(body: ConceptoVentaCreateDto) {
    return this.http.post<ConceptoVentaResponseDto>('conceptos-ventas', body).pipe(
      tap((resp) => {
        this.listAll.update((list) => [resp, ...list]);
      })
    );
  }

  update(body: ConceptoVentaUpdateDto, id: string) {
    return this.http
      .put<ConceptoVentaResponseDto>('conceptos-ventas/' + id, body)
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
      .delete<ConceptoVentaResponseDto>('conceptos-ventas/' + id)
      .pipe(
        tap(() => {
          this.listAll.update((list) => list.filter((row) => row.id != id));
        })
      );
  }
}
