import { HttpClient, HttpContext } from '@angular/common/http';
import { SKIP_LOADING } from '@core/auth.interceptor';
import { CatalogPageQuery, CatalogPageResponse, catalogPageParams } from '@shared/ui/native-table';
import { Injectable, signal } from '@angular/core';
import { DepartamentoCreateDto } from './dtos/departamento.create.dto';
import { Observable, tap } from 'rxjs';
import { DepartamentoResponseDto } from './dtos/departamento.response.dto';
import { DepartamentoUpdateDto } from './dtos/departamento.update.dto';

@Injectable({
  providedIn: 'root',
})
export class DepartamentoApiService {
  listDepartamento = signal<DepartamentoResponseDto[]>([]);
  constructor(private http: HttpClient) {}

  getAll(): Observable<DepartamentoResponseDto[]> {
    return this.http.get<DepartamentoResponseDto[]>('departamento').pipe(
      tap((resp) => {
        this.listDepartamento.set(resp);
      })
    );
  }

  getPage(query: CatalogPageQuery): Observable<CatalogPageResponse<DepartamentoResponseDto>> {
    return this.http.get<CatalogPageResponse<DepartamentoResponseDto>>('departamento/page', {
      params: catalogPageParams(query),
      context: new HttpContext().set(SKIP_LOADING, true),
    });
  }
  
  
  getOne(id:string): Observable<DepartamentoResponseDto> {
    return this.http.get<DepartamentoResponseDto>('departamento/'+id)
  }

  getAllFilter(
    params = '',
    headers = {}
  ): Observable<DepartamentoResponseDto[]> {
    return this.http.get<DepartamentoResponseDto[]>(
      'departamento' + params,
      {
        headers: headers,
      }
    );
  }
  create(body: DepartamentoCreateDto) {
    return this.http.post<DepartamentoResponseDto>('departamento', body).pipe(
      tap((resp) => {
        this.listDepartamento.update((list) => [resp, ...list]);
      })
    );
  }
  update(body: DepartamentoUpdateDto, id: string) {
    return this.http.put<DepartamentoResponseDto>('departamento/' + id, body).pipe(
      tap((resp) => {
        this.listDepartamento.update((list) => {
          const filter = list.filter((row) => row.idDepartamento != id);
          return [resp, ...filter];
        });
      })
    );
  }
  delete(id: string) {
    return this.http.delete<DepartamentoResponseDto>('departamento/' + id).pipe(
      tap((resp) => {
        this.listDepartamento.update((list) => {
          const filter = list.filter((row) => row.idDepartamento != id);
          return [...filter];
        });
      })
    );
  }
}
