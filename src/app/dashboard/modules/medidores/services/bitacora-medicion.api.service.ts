import { HttpClient } from '@angular/common/http';
import { Injectable, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { BitacoraMedicionCreateDto } from './dtos/bitacora-medicion.create.dto';
import { BitacoraMedicionResponseDto } from './dtos/bitacora-medicion.response.dto';

@Injectable({ providedIn: 'root' })
export class BitacoraMedicionApiService {
  listAll = signal<BitacoraMedicionResponseDto[]>([]);
  endPoint = 'bitacora-medicion';

  constructor(private http: HttpClient) {}

  getAllFilter(params = '', headers = {}): Observable<BitacoraMedicionResponseDto[]> {
    return this.http.get<BitacoraMedicionResponseDto[]>(`${this.endPoint}${params}`, { headers }).pipe(
      tap(resp => this.listAll.set(resp))
    );
  }

    getOne(id: string): Observable<BitacoraMedicionResponseDto> {
      return this.http.get<BitacoraMedicionResponseDto>(`${this.endPoint}/${id}`);
    }

  create(body: BitacoraMedicionCreateDto) {
    return this.http.post<BitacoraMedicionResponseDto>(this.endPoint, body).pipe(
      tap(resp => {
        this.listAll.update(list => [resp, ...list]);
      })
    );
  }
}
