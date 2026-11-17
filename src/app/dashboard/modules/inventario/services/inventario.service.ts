import { HttpClient, HttpContext } from '@angular/common/http';
import { Injectable, signal } from '@angular/core';
import { SKIP_LOADING } from '@core/auth.interceptor';
import { CatalogPageQuery, CatalogPageResponse, catalogPageParams } from '@shared/ui/native-table';
import { Observable, tap } from 'rxjs';
import { AlmacenCreateDto } from '../../almacen/services/dtos/almacen.create.dto';
import { AlmacenResponseDto } from '../../almacen/services/dtos/almacen.response.dto';
import { AlmacenUpdateDto } from '../../almacen/services/dtos/almacen.update.dto';
import { InventarioResponse } from './dto/inventario.response';

@Injectable({ providedIn: 'root' })
export class InventarioService {
  listAll = signal<AlmacenResponseDto[]>([]);
  constructor(private http: HttpClient) {}

  getAll(): Observable<AlmacenResponseDto[]> {
    return this.http.get<AlmacenResponseDto[]>('inventario').pipe(
      tap((resp) => {
        console.log(resp);
        this.listAll.set(resp);
      })
    );
  }
  /** GET inventario/page: paginación, filtros y orden en el servidor. */
  getPage(query: CatalogPageQuery): Observable<CatalogPageResponse<InventarioResponse>> {
    return this.http.get<CatalogPageResponse<InventarioResponse>>('inventario/page', {
      params: catalogPageParams(query),
      context: new HttpContext().set(SKIP_LOADING, true),
    });
  }
  getAllFilter(
    params = '',
    headers = {}
  ): Observable<InventarioResponse[]> {
    return this.http.get<InventarioResponse[]>(
      'inventario' + params,
      {
        headers: headers,
      }
    );
  }
  create(body: AlmacenCreateDto) {
    return this.http.post<AlmacenResponseDto>('almacen', body).pipe(
      tap((resp) => {
        this.listAll.update((list) => [resp, ...list]);
      })
    );
  }
  update(body: AlmacenUpdateDto, id: string) {
    return this.http.put<AlmacenResponseDto>('almacen/' + id, body).pipe(
      tap((resp) => {
        this.listAll.update((list) => {
          const filter = list.filter((row) => row.id != id);
          return [resp, ...filter];
        });
      })
    );
  }
  updatePartial(body: Partial<AlmacenUpdateDto>, id: string) {
    return this.http.put<AlmacenResponseDto>('almacen/' + id, body,{
      headers: {
        'hiddenLoading': 'true'
      }
    }).pipe(
      tap((resp) => {
        this.listAll.update((list) => {
          const filter = list.filter((row) => row.id != id);
          return [resp, ...filter];
        });
      })
    );
  }
  /** Borra un registro de inventario (almacén + producto). Antes apuntaba por error a 'almacen/'. */
  delete(id: string) {
    return this.http.delete<InventarioResponse>('inventario/' + id).pipe(
      tap((resp) => {
        this.listAll.update((list) => {
          const filter = list.filter((row) => row.id != id);
          return [...filter];
        });
      })
    );
  }
}
