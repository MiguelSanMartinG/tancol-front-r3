import { HttpClient } from '@angular/common/http';
import { Injectable, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { TipoEmpleadoResponse } from './dtos/tipo-empleado.response';
import { TipoEmpleadoDto } from './dtos/tipo-empleado.create.dto';

@Injectable({
  providedIn: 'root',
})
export class TipoEmpleadoApiService {
   listAll = signal<TipoEmpleadoResponse[]>([]);
  constructor(private http: HttpClient) {}


  create(body: TipoEmpleadoDto) {
    return this.http.post<any>('tipo-empleado', body).pipe(
      tap((resp) => {
        console.log(resp);
        this.listAll.update((list) => [resp, ...list]);
      })
    );
  }

  getAll(): Observable<TipoEmpleadoResponse[]> {
    return this.http.get<TipoEmpleadoResponse[]>('tipo-empleado').pipe(
      tap((resp) => {
        this.listAll.set(resp);
      })
    );
  }

  getOne(id:string){
    return this.http.get<TipoEmpleadoResponse>('tipo-empleado/'+id).pipe(
      tap((resp) => {
        return resp;
      })
    );
  }




  getAllFilter(
    params = '',
    headers = {}
  ): Observable<any[]> {
    return this.http.get<any[]>(
      'tipo-empleado' + params,
      {
        headers: headers,
      }
    );
  }

  update(body: TipoEmpleadoDto, id: string) {
    return this.http.put<TipoEmpleadoResponse>('tipo-empleado/' + id, body).pipe(
      tap((resp) => {
        this.listAll.update((list) => {
          const filter = list.filter((row) => row.id != id);
          return [resp, ...filter];
        });
      })
    );
  }
  
  delete(id: string) {
    return this.http.delete<TipoEmpleadoResponse>('tipo-empleado/' + id).pipe(
      tap((resp) => {
        this.listAll.update((list) => {
          const filter = list.filter((row) => row.idTipoEmpleado != id);
          return [...filter];
        });
      })
    );
  }
}
