import { HttpClient } from '@angular/common/http';
import { Injectable, signal } from '@angular/core';
import { tap, Observable } from 'rxjs';

export interface ModuloDto {
  idModulo: string;
  name: string;
  ruta: string;
  parent?:string;
}

@Injectable({ providedIn: 'root' })
export class ModuloApiService {
  listAll = signal<ModuloDto[]>([]);
  constructor(private http: HttpClient) {}

  getAll(): Observable<ModuloDto[]> {
    return this.http.get<ModuloDto[]>('modulo').pipe(
      tap((resp) => {
        this.listAll.set(resp);
      })
    );
  }
}
