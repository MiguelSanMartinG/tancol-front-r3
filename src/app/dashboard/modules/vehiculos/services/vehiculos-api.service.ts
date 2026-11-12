import { Injectable, signal } from '@angular/core';
import { VehiculosResponse } from './vehiculos.response';
import { HttpClient, HttpContext } from '@angular/common/http';
import { SKIP_LOADING } from '@core/auth.interceptor';
import { CatalogPageQuery, CatalogPageResponse, catalogPageParams } from '@shared/ui/native-table';
import { Observable, tap } from 'rxjs';
import { VehiculosDTO } from './vehiculos.dto';

@Injectable({ providedIn: 'root' })
export class VehiculosApiService {
listAll = signal<VehiculosResponse[]>([]);
  constructor(private http: HttpClient) {}

  getAll(): Observable<VehiculosResponse[]> {
    return this.http.get<VehiculosResponse[]>('vehiculos').pipe(
      tap((resp) => {
        this.listAll.set(resp);
      })
    );
  }

  getPage(query: CatalogPageQuery): Observable<CatalogPageResponse<VehiculosResponse>> {
    return this.http.get<CatalogPageResponse<VehiculosResponse>>('vehiculos/page', {
      params: catalogPageParams(query),
      context: new HttpContext().set(SKIP_LOADING, true),
    });
  }

  getOne(id:string){
    return this.http.get<VehiculosResponse>('vehiculos/'+id).pipe(
      tap((resp) => {
        return resp;
      })
    );
  }

  getAllFilter(
    params = '',
    headers = {}
  ): Observable<any[]> {
    return this.http.get<any[]>(
      'vehiculos' + params,
      {
        headers: headers,
      }
    ).pipe(
      tap((resp) => {
        this.listAll.set(resp);
      })
    );
  }
  create(body: VehiculosDTO) {
    return this.http.post<any>('vehiculos', body).pipe(
      tap((resp) => {
        console.log(resp);
        // this.listAll.update((list) => [resp, ...list]);
      })
    );
  }
  update(body: VehiculosDTO, id: string) {
    return this.http.put<VehiculosResponse>('vehiculos/' + id, body).pipe(
      tap((resp) => {
        this.listAll.update((list) => {
          const filter = list.filter((row) => row.id != id);
          return [resp, ...filter];
        });
      })
    );
  }
  delete(id: string) {
    return this.http.delete<VehiculosResponse>('vehiculos/' + id).pipe(
      tap((resp) => {
        this.listAll.update((list) => {
          const filter = list.filter((row) => row.id != id);
          return [...filter];
        });
      })
    );
  }
}
