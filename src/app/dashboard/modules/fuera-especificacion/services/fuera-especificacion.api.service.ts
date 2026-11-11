import { HttpClient } from '@angular/common/http';
import { Injectable, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { FueraEspecificacionDto } from './fuera-especificacion-dto';
import { FueraEspecificacionResponse } from './fuera-especificacion-response';

@Injectable({ providedIn: 'root' })
export class FueraEspecificacionApiService {
    listAll = signal<FueraEspecificacionResponse[]>([]);
    constructor(private http: HttpClient) {}

    create(body: FueraEspecificacionDto) {
        return this.http.post<FueraEspecificacionResponse>('concepto-rezago', body).pipe(
            tap(resp => {
                this.listAll.update(list => [resp, ...list]);
            })
        );
    }

    getAll(): Observable<FueraEspecificacionResponse[]> {
        return this.http.get<FueraEspecificacionResponse[]>('concepto-rezago').pipe(
            tap(resp => {
                this.listAll.set(resp);
            })
        );
    }

    getOne(id: string) {
        return this.http.get<FueraEspecificacionResponse>('concepto-rezago/' + id);
    }

    getAllFilter(params = '', headers = {}): Observable<any[]> {
        return this.http.get<any[]>('concepto-rezago' + params, { headers });
    }

    update(body: FueraEspecificacionDto, id: string) {
        return this.http.put<FueraEspecificacionResponse>('concepto-rezago/' + id, body).pipe(
            tap(resp => {
                this.listAll.update(list => {
                    const filter = list.filter(row => row.id != id);
                    return [resp, ...filter];
                });
            })
        );
    }

    delete(id: string) {
        return this.http.delete<FueraEspecificacionResponse>('concepto-rezago/' + id).pipe(
            tap(() => {
                this.listAll.update(list => list.filter(row => row.id != id));
            })
        );
    }
}
