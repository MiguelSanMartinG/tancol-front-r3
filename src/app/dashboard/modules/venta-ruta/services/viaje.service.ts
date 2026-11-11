import { HttpClient, HttpContext } from '@angular/common/http';
import { Injectable, signal } from '@angular/core';
import { Observable, Subject, tap } from 'rxjs';
import { SKIP_LOADING } from '@core/auth.interceptor';
import { ViajeDto } from './viaje-dto';

@Injectable({
  providedIn: 'root'
})
export class ViajeService {

  listAll = signal<any[]>([]);
  readonly liquidacionConteoActualizado = new Subject<{ idRuta: string | null; fecha: string }>();
  private readonly liquidacionUpdateChannel = typeof BroadcastChannel === 'undefined'
    ? null
    : new BroadcastChannel('tancol-liquidacion-conteo-actualizado');
  url:string = 'viaje'

  constructor(private http: HttpClient) {
    this.liquidacionUpdateChannel?.addEventListener('message', ({ data }) => {
      this.liquidacionConteoActualizado.next(data);
    });
  }

  notificarConteoLiquidacionActualizado(idRuta: string | null, fecha: string): void {
    const evento = { idRuta, fecha };
    this.liquidacionConteoActualizado.next(evento);
    this.liquidacionUpdateChannel?.postMessage(evento);
  }


//   getAll(): Observable<any[]> {
//     return this.http.get<any[]>(`${this.url}`).pipe(
//       tap((resp) => {
//         this.listAll.set(resp);
//       })
//     );
//   }

//   getOne(id: string) {
//     return this.http.get<any>(`${this.url}/` + id).pipe(
//       tap((resp) => resp)
//     );
//   }

//   getAllFilter(params = '', headers = {}): Observable<any[]> {
//     return this.http.get<any[]>(`${this.url}` + params, {
//       headers: headers,
//     });
//   }

  create(body: ViajeDto) {
    return this.http.post<any>(this.url, body).pipe(
      tap((resp) => {
        console.log(resp);
      })
    );
  }

  update(body: ViajeDto, id: string,  skipLoading = false) {
    return this.http.put<any>(this.url+'/' + id, body,{context: new HttpContext().set(SKIP_LOADING, skipLoading),}).pipe(
      tap((resp) => {
        this.listAll.update((list) => {
          const filter = list.filter((row) => row.idVenta != id);
          return [resp, ...filter];
        });
      })
    );
  }

  delete(id: string) {
    return this.http.delete<any>(`${this.url}/` + id).pipe(
      tap(() => {
        this.listAll.update((list) => {
          const filter = list.filter((row) => row.idVenta != id);
          return [...filter];
        });
      })
    );
  }
 }
