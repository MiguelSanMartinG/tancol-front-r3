import { HttpClient, HttpContext, HttpParams } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { SKIP_LOADING } from '@core/auth.interceptor';
import { CatalogPageQuery, CatalogPageResponse, catalogPageParams } from '@shared/ui/native-table';
import { Observable, tap } from 'rxjs';
import {
  CuadreCerrarDto,
  CuadreCreateDto,
  CuadreDetalle,
  CuadreFiltro,
  CuadrePartidasUpdateDto,
  CuadreResumen,
} from './cuadre-inventario.model';

@Injectable({
  providedIn: 'root',
})
export class CuadreInventarioApiService {
  private readonly http = inject(HttpClient);
  private readonly endpoint = 'cuadre-inventario';

  listAll = signal<CuadreResumen[]>([]);

  getAll(filtro: CuadreFiltro = {}): Observable<CuadreResumen[]> {
    let params = new HttpParams();
    if (filtro.idAlmacen) params = params.set('idAlmacen', filtro.idAlmacen);
    if (filtro.estado) params = params.set('estado', filtro.estado);
    return this.http
      .get<CuadreResumen[]>(this.endpoint, { params })
      .pipe(tap((resp) => this.listAll.set(resp)));
  }

  /** GET cuadre-inventario/page: paginación, filtros y orden en el servidor. */
  getPage(query: CatalogPageQuery): Observable<CatalogPageResponse<CuadreResumen>> {
    return this.http.get<CatalogPageResponse<CuadreResumen>>(`${this.endpoint}/page`, {
      params: catalogPageParams(query),
      context: new HttpContext().set(SKIP_LOADING, true),
    });
  }

  getOne(id: string): Observable<CuadreDetalle> {
    return this.http.get<CuadreDetalle>(`${this.endpoint}/${id}`);
  }

  create(body: CuadreCreateDto): Observable<CuadreDetalle> {
    return this.http.post<CuadreDetalle>(this.endpoint, body);
  }

  guardarPartidas(id: string, body: CuadrePartidasUpdateDto): Observable<CuadreDetalle> {
    return this.http.put<CuadreDetalle>(`${this.endpoint}/${id}/partidas`, body);
  }

  cerrar(id: string, body: CuadreCerrarDto): Observable<CuadreDetalle> {
    return this.http.post<CuadreDetalle>(`${this.endpoint}/${id}/cerrar`, body);
  }

  cancelar(id: string): Observable<CuadreResumen> {
    return this.http.delete<CuadreResumen>(`${this.endpoint}/${id}`).pipe(
      tap(() => this.listAll.update((list) => list.filter((row) => row.id !== id)))
    );
  }
}
