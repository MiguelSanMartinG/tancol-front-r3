import { HttpClient } from '@angular/common/http';
import { Injectable, signal } from '@angular/core';
import { ProveedorCreateDto } from './dtos/proveedor.create.dto';
import { Observable, tap } from 'rxjs';
import { ProveedorResponseDto } from './dtos/proveedor.response.dto';
import { ProveedorUpdateDto } from './dtos/proveedor.update.dto';

@Injectable({
  providedIn: 'root',
})
export class ProveedorApiService {
  listProveedor = signal<ProveedorResponseDto[]>([]);
  constructor(private http: HttpClient) {}

  getAll(): Observable<ProveedorResponseDto[]> {
    return this.http.get<ProveedorResponseDto[]>('proveedor').pipe(
      tap((resp) => {
        console.log('proveedor',resp);
        this.listProveedor.set(resp);
      })
    );
  }

  getOne(id:string){
    return this.http.get<ProveedorResponseDto>('proveedor/'+id).pipe(
      tap((resp) => {
        return resp;
      })
    );
  }

  getAllFilter(
    params = '',
    headers = {}
  ): Observable<ProveedorResponseDto[]> {
    return this.http.get<ProveedorResponseDto[]>(
      'proveedor' + params,
      {
        headers: headers,
      }
    );
  }
  create(body: ProveedorCreateDto) {
    return this.http.post<ProveedorResponseDto>('proveedor', body).pipe(
      tap((resp) => {
        this.listProveedor.update((list) => [resp, ...list]);
      })
    );
  }
  update(body: ProveedorUpdateDto, id: string) {
    return this.http.put<ProveedorResponseDto>('proveedor/' + id, body).pipe(
      tap((resp) => {
        this.listProveedor.update((list) => {
          const filter = list.filter((row) => row.id != id);
          return [resp, ...filter];
        });
      })
    );
  }
  delete(id: string) {
    return this.http.delete<ProveedorResponseDto>('proveedor/' + id).pipe(
      tap((resp) => {
        this.listProveedor.update((list) => {
          const filter = list.filter((row) => row.id != id);
          return [...filter];
        });
      })
    );
  }
}
