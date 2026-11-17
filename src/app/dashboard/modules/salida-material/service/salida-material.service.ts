import { Injectable, signal } from '@angular/core';
import { SalidaMaterialResponse } from './salida-material.response';
import { HttpClient, HttpContext } from '@angular/common/http';
import { SKIP_LOADING } from '@core/auth.interceptor';
import { CatalogPageQuery, CatalogPageResponse, catalogPageParams } from '@shared/ui/native-table';
import { Observable, tap } from 'rxjs';
import { FirmaRecibeDTO, SalidaMaterialDTO } from './salida-material.dto';

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

  /** GET orden-interna/page: paginación, filtros y orden en el servidor. */
  getPage(query: CatalogPageQuery): Observable<CatalogPageResponse<SalidaMaterialResponse>> {
    return this.http.get<CatalogPageResponse<SalidaMaterialResponse>>('orden-interna/page', {
      params: catalogPageParams(query),
      context: new HttpContext().set(SKIP_LOADING, true),
    });
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
  /** PATCH orden-interna/{id}/firma-recibe: firma una salida ya creada que aún no tiene firma. */
  firmarRecibe(id: string, body: FirmaRecibeDTO): Observable<SalidaMaterialResponse> {
    return this.http.patch<SalidaMaterialResponse>(`orden-interna/${id}/firma-recibe`, body).pipe(
      tap((resp) => {
        this.listAll.update((list) =>
          list.map((row) => (row.idOrdenInterna === id ? resp : row))
        );
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
