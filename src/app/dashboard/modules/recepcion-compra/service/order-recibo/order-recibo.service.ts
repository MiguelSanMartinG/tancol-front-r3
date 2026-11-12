import { inject, Injectable, signal } from '@angular/core';
import { EnumDto } from '@core/common/enum.dto';
import { TranslateService } from '@ngx-translate/core';
import { Observable, tap } from 'rxjs';
import { HttpClient, HttpContext } from '@angular/common/http';
import { SKIP_LOADING } from '@core/auth.interceptor';
import { CatalogPageQuery, CatalogPageResponse, catalogPageParams } from '@shared/ui/native-table';
import { OrdenReciboResponse } from '../dto/order-recibo.response';
import { OrdenReciboDto } from '../dto/order-recibo.dto';

@Injectable({ providedIn: 'root' })
export class OrderReciboService {
    translateService = inject(TranslateService);
    endPoint = 'orden/recibo';
    listAll = signal<OrdenReciboResponse[]>([]);
    listPrioridad = signal<EnumDto[]>([]);
    constructor(private http: HttpClient) {}

    getAll(): Observable<OrdenReciboResponse[]> {
      return this.http.get<OrdenReciboResponse[]>(this.endPoint).pipe(
        tap((resp) => {
          this.listAll.set(resp);
        })
      );
    }

    getPage(query: CatalogPageQuery): Observable<CatalogPageResponse<OrdenReciboResponse>> {
      return this.http.get<CatalogPageResponse<OrdenReciboResponse>>(this.endPoint + '/page', {
        params: catalogPageParams(query),
        context: new HttpContext().set(SKIP_LOADING, true),
      });
    }

    getOne(id:string): Observable<OrdenReciboResponse> {
      return this.http.get<OrdenReciboResponse>(this.endPoint+'/'+id).pipe(
        tap((resp) => {
          return resp;
        })
      );
    }

    recibo(request:OrdenReciboDto){
      return this.http.post(this.endPoint,request).pipe(
        tap((resp)=>{
          return resp
        })
      )
    }

}
