import { Injectable, signal } from '@angular/core';
import { InventarioInicialResponse } from './inventario-inicia.response';
import { HttpClient, HttpContext } from '@angular/common/http';
import { SKIP_LOADING } from '@core/auth.interceptor';
import { CatalogPageQuery, CatalogPageResponse, catalogPageParams } from '@shared/ui/native-table';
import { Observable, tap } from 'rxjs';
import { InventarioInicialDTO } from './inventario-inicial.dto';

@Injectable({ providedIn: 'root' })
export class InventarioInicialService {
  listAll = signal<InventarioInicialResponse[]>([]);
  constructor(private http: HttpClient) {}

  getAll(): Observable<InventarioInicialResponse[]> {
    return this.http.get<InventarioInicialResponse[]>('inventario').pipe(
      tap((resp) => {
        console.log(resp);
        this.listAll.set(resp);
      })
    );
  }
  /** GET inventario/page: paginación, filtros y orden en el servidor. */
  getPage(query: CatalogPageQuery): Observable<CatalogPageResponse<InventarioInicialResponse>> {
    return this.http.get<CatalogPageResponse<InventarioInicialResponse>>('inventario/page', {
      params: catalogPageParams(query),
      context: new HttpContext().set(SKIP_LOADING, true),
    });
  }
  getAllFilter(
    params = '',
    headers = {}
  ): Observable<InventarioInicialResponse[]> {
    return this.http.get<InventarioInicialResponse[]>(
      'inventariox' + params,
      {
        headers: headers,
      }
    );
  }
  getOne(id:string){
    return this.http.get<InventarioInicialResponse>('inventario/'+id);
  }
  create(body: InventarioInicialDTO) {
    return this.http.post<InventarioInicialResponse>('inventario', body).pipe(
      tap((resp) => {
        this.listAll.update((list) => [resp, ...list]);
      })
    );
  }
  update(body: InventarioInicialDTO, id: string) {
    return this.http.put<InventarioInicialResponse>('inventario/' + id, body).pipe(
      tap((resp) => {
        this.listAll.update((list) => {
          const filter = list.filter((row) => row.idInventario != id);
          return [resp, ...filter];
        });
      })
    );
  }
  updatePartial(body: Partial<InventarioInicialDTO>, id: string) {
    return this.http.put<InventarioInicialResponse>('inventario/' + id, body,{
      headers: {
        'hiddenLoading': 'true'
      }
    }).pipe(
      tap((resp) => {
        this.listAll.update((list) => {
          const filter = list.filter((row) => row.idInventario != id);
          return [resp, ...filter];
        });
      })
    );
  }
  delete(id: string) {
    return this.http.delete<InventarioInicialResponse>('inventario/' + id).pipe(
      tap((resp) => {
        this.listAll.update((list) => {
          const filter = list.filter((row) => row.idInventario != id);
          return [...filter];
        });
      })
    );
  }
}
