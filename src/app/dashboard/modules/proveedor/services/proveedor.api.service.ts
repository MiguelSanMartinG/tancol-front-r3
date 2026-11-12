import { HttpClient, HttpContext, HttpParams } from '@angular/common/http';
import { Injectable, signal } from '@angular/core';
import { ProveedorCreateDto } from './dtos/proveedor.create.dto';
import { Observable, tap } from 'rxjs';
import { ProveedorResponseDto } from './dtos/proveedor.response.dto';
import { ProveedorUpdateDto } from './dtos/proveedor.update.dto';
import { NativeFilters, NativeSort, filtersToParams, sortToParams } from '@shared/ui/native-table';
import { SKIP_LOADING } from '@core/auth.interceptor';

export interface ProveedorPageQuery {
  page: number;
  pageSize: number;
  search?: string;
  filters: NativeFilters;
  sort: NativeSort | null;
}

export interface ProveedorPageResponse {
  items: ProveedorResponseDto[];
  total: number;
  page: number;
  pageSize: number;
}

@Injectable({
  providedIn: 'root',
})
export class ProveedorApiService {
  listProveedor = signal<ProveedorResponseDto[]>([]);
  constructor(private http: HttpClient) {}

  getAll(): Observable<ProveedorResponseDto[]> {
    return this.http.get<ProveedorResponseDto[]>('proveedor').pipe(
      tap((resp) => {
        console.log('proveedor',resp);
        this.listProveedor.set(resp);
      })
    );
  }

  getOne(id:string){
    return this.http.get<ProveedorResponseDto>('proveedor/'+id).pipe(
      tap((resp) => {
        return resp;
      })
    );
  }

  getPage(query: ProveedorPageQuery): Observable<ProveedorPageResponse> {
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
    return this.http.get<ProveedorPageResponse>('proveedor/page', {
      params,
      context: new HttpContext().set(SKIP_LOADING, true),
    });
  }

  getAllFilter(
    params = '',
    headers = {}
  ): Observable<ProveedorResponseDto[]> {
    return this.http.get<ProveedorResponseDto[]>(
      'proveedor' + params,
      {
        headers: headers,
      }
    );
  }
  create(body: ProveedorCreateDto) {
    return this.http.post<ProveedorResponseDto>('proveedor', body).pipe(
      tap((resp) => {
        this.listProveedor.update((list) => [resp, ...list]);
      })
    );
  }
  update(body: ProveedorUpdateDto, id: string) {
    return this.http.put<ProveedorResponseDto>('proveedor/' + id, body).pipe(
      tap((resp) => {
        this.listProveedor.update((list) => {
          const filter = list.filter((row) => row.id != id);
          return [resp, ...filter];
        });
      })
    );
  }
  delete(id: string) {
    return this.http.delete<ProveedorResponseDto>('proveedor/' + id).pipe(
      tap((resp) => {
        this.listProveedor.update((list) => {
          const filter = list.filter((row) => row.id != id);
          return [...filter];
        });
      })
    );
  }
}
