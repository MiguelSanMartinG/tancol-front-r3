import { Injectable, signal } from '@angular/core';
import { EmpleadoResponseDto } from './dtos/empleado.response';
import { HttpClient, HttpContext } from '@angular/common/http';
import { SKIP_LOADING } from '@core/auth.interceptor';
import { CatalogPageQuery, CatalogPageResponse, catalogPageParams } from '@shared/ui/native-table';
import { forkJoin, map, Observable, of, tap } from 'rxjs';
import { ArchivoDocumentoResponse, EmpleadoDto, TipoDocumentoEmpleado } from './dtos/empleado.create.dto';

@Injectable({ providedIn: 'root' })
export class EmpleadoApiService {
   listAll = signal<EmpleadoResponseDto[]>([]);
  constructor(private http: HttpClient) {}

    getAll(): Observable<EmpleadoResponseDto[]> {
      return this.http.get<EmpleadoResponseDto[]>('empleados').pipe(
        tap((resp) => {
          this.listAll.set(resp);
        })
      );
    }

    getPage(query: CatalogPageQuery): Observable<CatalogPageResponse<EmpleadoResponseDto>> {
      return this.http.get<CatalogPageResponse<EmpleadoResponseDto>>('empleados/page', {
        params: catalogPageParams(query),
        context: new HttpContext().set(SKIP_LOADING, true),
      });
    }

      getAllFilter(
    params = '',
    headers = {}
  ): Observable<any[]> {
    return this.http.get<any[]>(
      'empleados' + params,
      {
        headers: headers,
      }
    ).pipe(
      tap((resp) => {
        this.listAll.set(resp);
      })
    );
  }

      create(body: EmpleadoDto) {
        return this.http.post<any>('empleados', body).pipe(
          tap((resp) => {
            console.log(resp);
            this.listAll.update((list) => [resp, ...list]);
          })
        );
      }

  delete(id: string) {
    return this.http.delete<EmpleadoResponseDto>('empleados/' + id).pipe(
      tap((resp) => {
        this.listAll.update((list) => {
          const filter = list.filter((row) => row.idEmpleado != id);
          return [...filter];
        });
      })
    );
  }
    update(body: EmpleadoDto, id: string) {
      return this.http.put<EmpleadoResponseDto>('empleados/' + id, body).pipe(
        tap((resp) => {
          this.listAll.update((list) => {
            const filter = list.filter((row) => row.idEmpleado != id);
            return [resp, ...filter];
          });
        })
      );
    }

  /** Sube el archivo de un documento de RH; regresa el nombre con el que se guardó. */
  subirDocumento(file: File): Observable<ArchivoDocumentoResponse> {
    const body = new FormData();
    body.append('file', file);
    return this.http.post<ArchivoDocumentoResponse>('empleados/documentos/archivo', body);
  }

  /**
   * Sube en paralelo los archivos nuevos de documentos y regresa { tipo: nombre guardado }.
   * Si no hay archivos, emite {} de inmediato (forkJoin([]) no emite nada).
   */
  subirDocumentos(archivos: { tipo: TipoDocumentoEmpleado; file: File }[]): Observable<Partial<Record<TipoDocumentoEmpleado, string>>> {
    if (!archivos.length) return of({});
    return forkJoin(
      archivos.map(({ tipo, file }) =>
        this.subirDocumento(file).pipe(map((resp) => [tipo, resp.fileName] as const))
      )
    ).pipe(map((pares) => Object.fromEntries(pares) as Partial<Record<TipoDocumentoEmpleado, string>>));
  }

      getOne(id:string){
        return this.http.get<EmpleadoResponseDto>('empleados/'+id).pipe(
          tap((resp) => {
            return resp;
          })
        );
      }
}
