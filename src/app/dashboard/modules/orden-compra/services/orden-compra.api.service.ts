import { HttpClient, HttpContext } from '@angular/common/http';
import { SKIP_LOADING } from '@core/auth.interceptor';
import { CatalogPageQuery, CatalogPageResponse, catalogPageParams } from '@shared/ui/native-table';
import { inject, Injectable, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { OrdenResponseDto } from './dtos/orden-compra.response.dto';
import { EnumDto } from '@core/common/enum.dto';
import { TranslateService } from '@ngx-translate/core';
import { OrdenCompraUpdateDto } from './dtos/orden-compra.update.dto';
import { OrdenFacturacionDto } from './dtos/order-facturacion.dto';

@Injectable({
  providedIn: 'root',
})
export class OrdenCompraApiService {
  translateService = inject(TranslateService);
  endPoint = 'orden/facturacion';
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
    precio: string
  }> {
    return this.http.get<{
      precio: string
    }>(
      'precio-producto',
      {
        params: params,
        headers: headers,
      }
    );
  }
  setPrecioProducto(
    body:{
      idProducto: string,
     idProveedor: string,
      precio: number
    },
    headers = {}
  ): Observable<{
    precio: string
  }> {
    return this.http.patch<{
      precio: string
    }>(
     'precio-producto',
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




  facturar(body: OrdenFacturacionDto) {
    return this.http.post<OrdenResponseDto>(this.endPoint , body);
  }
  actualizarEstado(id: string, accion: 'AUTORIZADO' | 'ORDEN_COMPLETA'  | 'CANCELADA' ) {
    return this.http.patch<OrdenResponseDto>('orden/solicitud/' + id + '&' + accion, {}).pipe(
      tap((resp) => {
        this.listAll.update((list) => {
          const filter = list.filter((row) => row.id != id);
          return [resp, ...filter];
        });
      })
    );
  }
  updatePartial(body: Partial<OrdenCompraUpdateDto>, id: string) {
    return this.http.put<OrdenResponseDto>(this.endPoint+ '/' + id, body,{
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
  delete(id: string) {
    return this.http.delete<OrdenResponseDto>('SolicitudCompra/' + id).pipe(
      tap((resp) => {
        this.listAll.update((list) => {
          const filter = list.filter((row) => row.id != id);
          return [...filter];
        });
      })
    );
  }


  getOneOrdenFactura(idOrden:string){
    return this.http.get<any>(this.endPoint+'/'+idOrden)
  }

  pasarRecepcion(idOrden:string){
    return this.http.patch(this.endPoint+'/'+idOrden,{estatusFactura:"COMPLETADA"})
  }
}
