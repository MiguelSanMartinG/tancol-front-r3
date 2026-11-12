import { HttpClient, HttpContext } from '@angular/common/http';
import { SKIP_LOADING } from '@core/auth.interceptor';
import { CatalogPageQuery, CatalogPageResponse, catalogPageParams } from '@shared/ui/native-table';
import { Injectable, signal } from '@angular/core';
import { AlmacenCreateDto } from './dtos/almacen.create.dto';
import { Observable, tap } from 'rxjs';
import { AlmacenResponseDto } from './dtos/almacen.response.dto';
import { AlmacenUpdateDto } from './dtos/almacen.update.dto';

@Injectable({
  providedIn: 'root',
})
export class AlmacenApiService {
  listAll = signal<AlmacenResponseDto[]>([]);
  constructor(private http: HttpClient) {}

  getAll(): Observable<AlmacenResponseDto[]> {
    return this.http.get<AlmacenResponseDto[]>('almacen').pipe(
      tap((resp) => {
        console.log(resp);
        this.listAll.set(resp);
      })
    );
  }

  getPage(query: CatalogPageQuery): Observable<CatalogPageResponse<AlmacenResponseDto>> {
    return this.http.get<CatalogPageResponse<AlmacenResponseDto>>('almacen/page', {
      params: catalogPageParams(query),
      context: new HttpContext().set(SKIP_LOADING, true),
    });
  }
  getAllFilter(
    params = '',
    headers = {}
  ): Observable<AlmacenResponseDto[]> {
    return this.http.get<AlmacenResponseDto[]>(
      'almacen' + params,
      {
        headers: headers,
      }
    ).pipe(
      tap((resp) => {
        // this.listAll.set(resp);
      })
    );
  }
  create(body: AlmacenCreateDto) {
    return this.http.post<AlmacenResponseDto>('almacen', body).pipe(
      tap((resp) => {
        this.listAll.update((list) => [resp, ...list]);
      })
    );
  }
  update(body: AlmacenUpdateDto, id: string) {
    return this.http.put<AlmacenResponseDto>('almacen/' + id, body).pipe(
      tap((resp) => {
        this.listAll.update((list) => {
          const filter = list.filter((row) => row.id != id);
          return [resp, ...filter];
        });
      })
    );
  }
  updatePartial(body: Partial<AlmacenUpdateDto>, id: string) {
    return this.http.put<AlmacenResponseDto>('almacen/' + id, body,{
      headers: {
        'hiddenLoading': 'true'
      }
    }).pipe(
      tap((resp) => {
        this.listAll.update((list) => {
          const filter = list.filter((row) => row.id != id);
          return [resp, ...filter];
        });
      })
    );
  }
  delete(id: string) {
    return this.http.delete<AlmacenResponseDto>('almacen/' + id).pipe(
      tap((resp) => {
        this.listAll.update((list) => {
          const filter = list.filter((row) => row.id != id);
          return [...filter];
        });
      })
    );
  }
}
