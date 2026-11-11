import { inject, Injectable, signal } from '@angular/core';
import { EnumDto } from '@core/common/enum.dto';
import { TranslateService } from '@ngx-translate/core';
import { Observable, tap } from 'rxjs';
import { HttpClient } from '@angular/common/http';
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
