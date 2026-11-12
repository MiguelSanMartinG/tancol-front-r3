import { HttpClient, HttpContext } from '@angular/common/http';
import { SKIP_LOADING } from '@core/auth.interceptor';
import { CatalogPageQuery, CatalogPageResponse, catalogPageParams } from '@shared/ui/native-table';
import { Injectable, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { MedidorCreateDto } from './dtos/medidor.create.dto';
import { MedidorResponseDto } from './dtos/medidor.response.dto';
import { MedidorUpdateDto } from './dtos/medidor.update.dto';

@Injectable({ providedIn: 'root' })
export class MedidorApiService {
  listAll = signal<MedidorResponseDto[]>([]);
  endPoint = 'medidores';

  constructor(private http: HttpClient) {}

  getAll(): Observable<MedidorResponseDto[]> {
    return this.http.get<MedidorResponseDto[]>(this.endPoint).pipe(
      tap((resp) => this.listAll.set(Array.isArray(resp) ? resp : []))
    );
  }

  getPage(query: CatalogPageQuery): Observable<CatalogPageResponse<MedidorResponseDto>> {
    return this.http.get<CatalogPageResponse<MedidorResponseDto>>(`${this.endPoint}/page`, {
      params: catalogPageParams(query),
      context: new HttpContext().set(SKIP_LOADING, true),
    });
  }

  getOne(id: string): Observable<MedidorResponseDto> {
    return this.http.get<MedidorResponseDto>(`${this.endPoint}/${id}`);
  }

  getAllFilter(params = '', headers = {}): Observable<MedidorResponseDto[]> {
    return this.http.get<MedidorResponseDto[]>(this.endPoint + params, { headers });
  }

  create(body: MedidorCreateDto) {
    return this.http.post<MedidorResponseDto>(this.endPoint, body).pipe(
      tap((resp) => {
        this.listAll.update((list) => [resp, ...list]);
      })
    );
  }

  update(body: MedidorUpdateDto, id: string) {
    return this.http.put<MedidorResponseDto>(`${this.endPoint}/${id}`, body).pipe(
      tap((resp) => {
        this.listAll.update((list) => {
          const filter = list.filter((row) => row.idMedidor !== id);
          return [resp, ...filter];
        });
      })
    );
  }

  delete(id: string) {
    return this.http.delete<MedidorResponseDto>(`${this.endPoint}/${id}`).pipe(
      tap(() => {
        this.listAll.update((list) => list.filter((row) => row.idMedidor !== id));
      })
    );
  }

  /**
   * Reinicia el medidor. Body: { idMedidor: string, mensaje: string }
   */
  reset(body: { idMedidor: string; mensaje?: string }) {
    return this.http.post<any>(`${this.endPoint}/reset`, body).pipe(
      tap(() => {
        // Oportunidad para refrescar lista o emitir efectos si hace falta
      })
    );
  }

  crearRelacion(body: { idMedidorHijo: string; idMedidorPadre: string }) {
    return this.http.post<any>(`${this.endPoint}/crear-relaccion`, body);
  }
}
