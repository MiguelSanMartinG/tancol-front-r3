import { HttpClient, HttpContext } from '@angular/common/http';
import { SKIP_LOADING } from '@core/auth.interceptor';
import { CatalogPageQuery, CatalogPageResponse, catalogPageParams } from '@shared/ui/native-table';
import { Injectable, signal } from '@angular/core';
import { ProductoCreateDto } from './dtos/producto.create.dto';
import { Observable, tap, throwError, timeout } from 'rxjs';
import { ProductoResponseDto } from './dtos/producto.response.dto';
import { ProductoUpdateDto } from './dtos/producto.update.dto';
import { productoStockValido } from './producto-stock.validator';

@Injectable({
  providedIn: 'root',
})
export class ProductoApiService {
  listProducto = signal<ProductoResponseDto[]>([]);
  constructor(private http: HttpClient) {}

  getAll(): Observable<ProductoResponseDto[]> {
    return this.http.get<ProductoResponseDto[]>('producto').pipe(
      tap((resp) => {
        this.listProducto.set(resp);
      })
    );
  }

  getPage(query: CatalogPageQuery): Observable<CatalogPageResponse<ProductoResponseDto>> {
    return this.http.get<CatalogPageResponse<ProductoResponseDto>>('producto/page', {
      params: catalogPageParams(query),
      context: new HttpContext().set(SKIP_LOADING, true),
    });
  }

    getAllFilter(
      params = '',
      headers = {}
    ): Observable<ProductoResponseDto[]> {
      return this.http.get<ProductoResponseDto[]>(
        'producto' + params,
        {
          headers: headers,
        }
      ).pipe(
      tap((resp) => {
        this.listProducto.set(resp);
      })
    );
    }
  create(body: ProductoCreateDto) {
    if (!productoStockValido(body)) return throwError(() => new Error('Las alertas de stock requieren stock mínimo y el stock máximo no puede ser menor al mínimo.'));
    return this.http.post('producto', body, { responseType: 'text' }).pipe(
      tap(() => this.getAll().subscribe())
    );
  }
  update(body: Partial<ProductoUpdateDto>, id: string) {
    if (!productoStockValido(body)) return throwError(() => new Error('Las alertas de stock requieren stock mínimo y el stock máximo no puede ser menor al mínimo.'));
    return this.http.put<ProductoResponseDto>('producto/' + id, body).pipe(
      tap((updatedProduct) => {
        this.listProducto.update((list) => list.map((product) =>
          product.idProducto === id
            ? { ...product, ...updatedProduct, updatedAt: updatedProduct.updatedAt ?? '' }
            : product,
        ));
      })
    );
  }
  delete(id: string) {
    return this.http.delete<ProductoResponseDto>('producto/' + id).pipe(
      tap((resp) => {
        this.listProducto.update((list) => {
          const filter = list.filter((row) => row.idProducto != id);
          return [ ...filter];
        });
      })
    );
  }
  revisarStockMinimo() {
    return this.http.post<ProductoStockReviewResponse>('producto/revisar-stock-minimo', null).pipe(timeout({ first: 15000 }));
  }
}

export interface ProductoStockReviewResponse {
  ejecutadoEn: string;
  totalEvaluadas: number;
  totalBajoMinimo: number;
  destinatariosEncontrados: number;
  notificacionesGeneradas: number;
  bajoMinimo: { idProducto: string; nombre: string; sku: string; stockMinimo: number; stockActual: number }[];
}
