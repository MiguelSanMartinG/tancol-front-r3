import { HttpClient, HttpContext, HttpParams } from '@angular/common/http';
import { Injectable, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { NativeFilters, NativeSort, filtersToParams, sortToParams } from '@shared/ui/native-table';
import { SKIP_LOADING } from '@core/auth.interceptor';
import { EquipoDto } from './equipo.dto';
import { EquipoResponse } from './equipo.response';

export interface EquipoPageQuery {
  page: number;
  pageSize: number;
  search?: string;
  filters: NativeFilters;
  sort: NativeSort | null;
}

export interface EquipoPageResponse {
  items: EquipoResponse[];
  total: number;
  page: number;
  pageSize: number;
}

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

  getPage(query: EquipoPageQuery): Observable<EquipoPageResponse> {
    let params = new HttpParams()
      .set('page', String(query.page))
      .set('pageSize', String(query.pageSize));
    if (query.search) params = params.set('search', query.search);
    const tableParams = {
      ...filtersToParams(query.filters),
      ...sortToParams(query.sort),
    };
    for (const [key, value] of Object.entries(tableParams)) {
      params = params.set(key, value);
    }
    return this.http.get<EquipoPageResponse>('equipo/page', {
      params,
      context: new HttpContext().set(SKIP_LOADING, true),
    });
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
