import { Injectable, signal } from '@angular/core';
import { EmpleadoResponseDto } from './dtos/empleado.response';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { EmpleadoDto } from './dtos/empleado.create.dto';

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

      getOne(id:string){
        return this.http.get<EmpleadoResponseDto>('empleados/'+id).pipe(
          tap((resp) => {
            return resp;
          })
        );
      }
}
