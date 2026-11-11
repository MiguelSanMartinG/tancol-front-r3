import { HttpClient } from '@angular/common/http';
import { Injectable, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { TipoProveedorCreateDto } from './dtos/tipo-proveedor.create.dto';
import { TipoProveedorResponseDto } from './dtos/tipo-proveedor.response.dto';

@Injectable({
  providedIn: 'root',
})
export class TipoProveedorApiService {
   listAll = signal<TipoProveedorResponseDto[]>([]);
  constructor(private http: HttpClient) {}

  getAll(): Observable<TipoProveedorResponseDto[]> {
    return this.http.get<TipoProveedorResponseDto[]>('tipo-proveedor').pipe(
      tap((resp) => {
        this.listAll.set(resp);
      })
    );
  }

  getOne(id:string){
    return this.http.get<TipoProveedorResponseDto>('tipo-proveedor/'+id).pipe(
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
      'tipo-proveedor' + params,
      {
        headers: headers,
      }
    );
  }
  create(body: TipoProveedorCreateDto) {
    return this.http.post<any>('tipo-proveedor', body).pipe(
      tap((resp) => {
        console.log(resp);
        // this.listAll.update((list) => [resp, ...list]);
      })
    );
  }
  update(body: TipoProveedorCreateDto, id: string) {
    return this.http.put<TipoProveedorResponseDto>('tipo-proveedor/' + id, body).pipe(
      tap((resp) => {
        this.listAll.update((list) => {
          const filter = list.filter((row) => row.id != id);
          return [resp, ...filter];
        });
      })
    );
  }
  delete(id: string) {
    return this.http.delete<TipoProveedorResponseDto>('tipo-proveedor/' + id).pipe(
      tap((resp) => {
        this.listAll.update((list) => {
          const filter = list.filter((row) => row.id != id);
          return [...filter];
        });
      })
    );
  }
}
