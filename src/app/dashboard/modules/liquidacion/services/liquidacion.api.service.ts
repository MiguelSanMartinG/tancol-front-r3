import { Injectable, signal } from '@angular/core';
import { HttpClient, HttpContext } from '@angular/common/http';
import { SKIP_LOADING } from '@core/auth.interceptor';
import { CatalogPageQuery, CatalogPageResponse, catalogPageParams } from '@shared/ui/native-table';
import { Observable, tap } from 'rxjs';
import { LiquidacionListItem, LiquidacionResponse } from './dtos/liquidacion.response.dto';
import { CancelarPartidaRequest, LiquidacionDTO } from './dtos/liquidacion.dto';

@Injectable({ providedIn: 'root' })
export class LiquidacionApiService {
  listAll = signal<LiquidacionResponse[]>([]);

  constructor(private http: HttpClient) {}

  getAll(): Observable<LiquidacionResponse[]> {
    return this.http.get<LiquidacionResponse[]>('liquidacion').pipe(
      tap((resp) => {
        this.listAll.set(resp);
      })
    );
  }

  getPage(query: CatalogPageQuery): Observable<CatalogPageResponse<LiquidacionListItem>> {
    return this.http.get<CatalogPageResponse<LiquidacionListItem>>('liquidacion/page', {
      params: catalogPageParams(query),
      context: new HttpContext().set(SKIP_LOADING, true),
    });
  }

  getOne(id: string) {
    return this.http
      .get<LiquidacionResponse>('liquidacion/' + id)
      .pipe(tap((resp) => resp));
  }

  getNota(bloque:string){
    return this.http.get<LiquidacionNota>('liquidacion/nota/'+bloque);
  }

  getAllFilter(params = '', headers = {}): Observable<LiquidacionResponse[]> {
    return this.http.get<LiquidacionResponse[]>('liquidacion' + params, {
      headers: headers,
    });
  }

  create(body: LiquidacionDTO) {
    return this.http.post<LiquidacionResponse>('liquidacion', body).pipe(
      tap((resp) => {
        this.listAll.update((list) => [resp, ...list]);
      })
    );
  }

  update(body: LiquidacionDTO, id: string) {
    return this.http.put<LiquidacionResponse>('liquidacion/' + id, body).pipe(
      tap((resp) => {
        this.listAll.update((list) => {
          const filter = list.filter((row) => row.idLiquidacion != id);
          return [resp, ...filter];
        });
      })
    );
  }

  cancelarPartida(liquidacionId: string, partidaId: string, body: CancelarPartidaRequest) {
    return this.http.post<LiquidacionResponse>(
      `liquidacion/${liquidacionId}/partidas/${partidaId}/cancelar`,
      body
    );
  }

  cancelar(id: string, motivo: string) {
    return this.http.post<LiquidacionResponse>(`liquidacion/${id}/cancelar`, { motivo });
  }

  delete(id: string) {
    return this.http.delete<LiquidacionResponse>('liquidacion/' + id).pipe(
      tap(() => {
        this.listAll.update((list) => {
          const filter = list.filter((row) => row.idLiquidacion != id);
          return [...filter];
        });
      })
    );
  }
}

export interface LiquidacionNota{
  lastFolio:number
}

