import { HttpClient, HttpContext } from '@angular/common/http';
import { SKIP_LOADING } from '@core/auth.interceptor';
import { CatalogPageQuery, CatalogPageResponse, catalogPageParams } from '@shared/ui/native-table';
import { inject, Injectable, signal } from '@angular/core';
import { SolicitudCompraCreateDto } from './dtos/solicitud-compra.create.dto';
import { Observable, tap } from 'rxjs';
import { OrdenResponseDto } from './dtos/solicitud-compra.response.dto';
import { SolicitudCompraUpdateDto } from './dtos/solicitud-compra.update.dto';
import { EnumDto } from '@core/common/enum.dto';
import { TranslateService } from '@ngx-translate/core';

@Injectable({
  providedIn: 'root',
})
export class OrdenApiService {
  translateService = inject(TranslateService);
  endPoint = 'orden/solicitud';
  listAll = signal<OrdenResponseDto[]>([]);
  listPrioridad = signal<EnumDto[]>([]);
  constructor(private http: HttpClient) {}

  getAll(): Observable<OrdenResponseDto[]> {
    return this.http.get<OrdenResponseDto[]>(this.endPoint).pipe(
      tap((resp) => {
        this.listAll.set(resp);
      })
    );
  }
  getPage(query: CatalogPageQuery): Observable<CatalogPageResponse<OrdenResponseDto>> {
    return this.http.get<CatalogPageResponse<OrdenResponseDto>>(this.endPoint + '/page', {
      params: catalogPageParams(query),
      context: new HttpContext().set(SKIP_LOADING, true),
    });
  }
  getOne(id: string): Observable<OrdenResponseDto> {
    return this.http.get<OrdenResponseDto>(this.endPoint + '/' + id);
  }
  getAllPrioridades(): Observable<string[]> {
    return this.http.get<string[]>('orden/prioridades').pipe(
      tap((resp) => {
        this.listPrioridad.set(resp.map( row => {
          return {
            clave: row,
            label: this.translateService.instant('prioridades.'+row)
          }
        }));
      })
    );
  }
  getPrecioProducto(
    params: Partial<{
      idProducto: string,
      idProveedor: string,
    }> = {},
    headers = {}
  ): Observable<{
    precio: string,
    idPrecio:string,
  }> {
    return this.http.get<{
      precio: string,
      idPrecio:string,
    }>(
      'precio-proveedor',
      {
        params: params,
        headers: headers,
      }
    );
  }
  setPrecioProducto(
    body:{
      idPrecio:string,
      precio: number
    },
    headers = {}
  ): Observable<{
    precio: number,
    idPrecio:string
  }> {
    return this.http.patch<{
      precio: number,
      idPrecio:string
    }>(
     'precio-proveedor',
     body,
      {
        headers: headers,
      }
    );
  }
  getAllFilter(
    params = '',
    headers = {}
  ): Observable<OrdenResponseDto[]> {
    return this.http.get<OrdenResponseDto[]>(
      this.endPoint + params,
      {
        headers: headers,
      }
    );
  }
  
  create(body: SolicitudCompraCreateDto) {
    return this.http.post<OrdenResponseDto>(this.endPoint, body).pipe(
      tap((resp) => {
        this.listAll.update((list) => [resp, ...list]);
      })
    );
  }

  update(body: SolicitudCompraUpdateDto, id: string) {
    return this.http.put<OrdenResponseDto>(this.endPoint + '/' + id, body).pipe(
      tap((resp) => {
        this.listAll.update((list) => {
          const filter = list.filter((row) => row.idSolicitud != id);
          return [resp, ...filter];
        });
      })
    );
  }
  actualizarEstado(id: string, accion: 'AUTORIZADO' | 'COMPLETADA'  | 'CANCELADA' ) {
    return this.http.patch<OrdenResponseDto>('orden/solicitud/' + id, {solicitudEstatus:accion}).pipe(
      tap((resp) => {
        this.listAll.update((list) => {
          const filter = list.filter((row) => row.idSolicitud != id);
          return [resp, ...filter];
        });
      })
    );
  }
  updatePartial(body: Partial<SolicitudCompraUpdateDto>, id: string) {
    return this.http.put<OrdenResponseDto>(this.endPoint+ '/' + id, body,{
      headers: {
        'hiddenLoading': 'true'
      }
    }).pipe(
      tap((resp) => {
        this.listAll.update((list) => {
          const filter = list.filter((row) => row.idSolicitud != id);
          return [resp, ...filter];
        });
      })
    );
  }
  delete(id: string) {
    return this.http.delete<OrdenResponseDto>('SolicitudCompra/' + id).pipe(
      tap((resp) => {
        this.listAll.update((list) => {
          const filter = list.filter((row) => row.idSolicitud != id);
          return [...filter];
        });
      })
    );
  }
}
