import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { LiquidacionResponse } from './dtos/liquidacion.response.dto';
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

