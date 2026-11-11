import { HttpClient } from '@angular/common/http';
import { Injectable, signal } from '@angular/core';
import { CategoriaProductoCreateDto } from './dtos/categoria-producto.create.dto';
import { Observable, tap } from 'rxjs';
import { CategoriaProductoResponseDto } from './dtos/categoria-producto.response.dto';
import { CategoriaProductoUpdateDto } from './dtos/categoria-producto.update.dto';

@Injectable({
  providedIn: 'root',
})
export class CategoriaProductoApiService {
  listAll = signal<CategoriaProductoResponseDto[]>([]);
  constructor(private http: HttpClient) {}

  getAll(): Observable<CategoriaProductoResponseDto[]> {
    return this.http.get<CategoriaProductoResponseDto[]>('category').pipe(
      tap((resp) => {
        this.listAll.set(resp);
      })
    );
  }
  getAllFilter(params = '', headers = {}): Observable<CategoriaProductoResponseDto[]> {
    return this.http.get<CategoriaProductoResponseDto[]>('category' + params, {
      headers: headers
    });
  }
  getProductos(id: string) {
    return this.http.get<{ idCategoria: string; nombre: string; numeroProductos: number; productos: Array<{ idProducto: string; nombre: string; sku?: string }> }>(`category/${id}/productos`);
  }
  getRecuento(id: string) {
    return this.http.get<{ idCategoria: string; nombre: string; subcategorias: Array<{ idCategoria: string; nombre: string; numeroProductos: number; existencia: Array<{ unidad: string; cantidad: number }> }> }>(`category/${id}/recuento`);
  }
  getExistencia(id: string) {
    return this.http.get<{ idCategoria: string; nombre: string; productos: Array<{ idProducto: string; nombre: string; cantidad: number; unidad: string }>; totales: Array<{ unidad: string; cantidad: number }> }>(`category/${id}/existencia`);
  }
  create(body: CategoriaProductoCreateDto) {
    return this.http.post<CategoriaProductoResponseDto>('category', body).pipe(
      tap((resp) => {
        this.listAll.update((list) => [resp, ...list]);
      })
    );
  }
  update(body: CategoriaProductoUpdateDto, id: string) {
    return this.http.put<CategoriaProductoResponseDto>('category/' + id, body).pipe(
      tap((resp) => {
        this.listAll.update((list) => {
          const filter = list.filter((row) => row.idCategoria != id);
          return [resp, ...filter];
        });
      })
    );
  }
  delete( id: string) {
    return this.http.delete<CategoriaProductoResponseDto>('category/' + id).pipe(
      tap((resp) => {
        this.listAll.update((list) => {
          const filter = list.filter((row) => row.idCategoria != id);
          return [...filter];
        });
      })
    );
  }
}
