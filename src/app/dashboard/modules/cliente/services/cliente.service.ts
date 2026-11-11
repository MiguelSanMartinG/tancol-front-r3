import { Injectable, signal } from '@angular/core';
import { ClienteResponse } from './cliente.response';
import { HttpClient } from '@angular/common/http';
import { ClienteDTO } from './cliente.dto';
import { map, Observable, tap } from 'rxjs';

export interface HistorialPrecioCliente {
  fecha: string;
  id: string;
  idProducto: string;
  operacionId: string;
  precioAnterior: number;
  precioNuevo: number;
  producto: string;
  tipoActualizacion: string;
  usuario: string;
}

@Injectable({ providedIn: 'root' })
export class ClienteApiService {
   listAll = signal<ClienteResponse[]>([]);
  constructor(private http: HttpClient) {}


  create(body: ClienteDTO) {
    return this.http.post<any>('cliente', body).pipe(
      tap((resp) => {
        console.log(resp);
        this.listAll.update((list) => [resp, ...list]);
      })
    );
  }

  getAll(): Observable<ClienteResponse[]> {
    return this.http.get<ClienteResponse[]>('cliente').pipe(
      tap((resp) => {
        this.listAll.set(resp);
      })
    );
  }

  getOne(id:string){
    return this.http.get<ClienteResponse>('cliente/'+id).pipe(
      tap((resp) => {
        return resp;
      })
    );
  }

  getUltimoNombreComercial(id: string): Observable<string> {
    return this.http.get<any>(`cliente/${id}/historial/nombre-comercial`).pipe(
      map((resp) => this.extractHistorialValue(resp))
    );
  }

  getUltimaRazonSocial(id: string): Observable<string> {
    return this.http.get<any>(`cliente/${id}/historial/razon-social`).pipe(
      map((resp) => this.extractHistorialValue(resp))
    );
  }

  getHistorialPrecios(id: string): Observable<HistorialPrecioCliente[]> {
    return this.http.get<HistorialPrecioCliente[]>(`cliente/${id}/historial/precios`);
  }

  exists(filtro: any): Observable<boolean> {
  const query = new URLSearchParams(filtro).toString();
  return this.http.get<{ exists: boolean }>(`/cliente/exists?${query}`).pipe(
    map(res => res.exists)
  );
}




  getAllFilter(
    params = '',
    headers = {}
  ): Observable<any[]> {
    return this.http.get<any[]>(
      'cliente' + params,
      {
        headers: headers,
      }
    );
  }

  update(body: ClienteDTO, id: string) {
    return this.http.put<ClienteResponse>('cliente/' + id, body).pipe(
      tap((resp) => {
        this.listAll.update((list) => {
          const filter = list.filter((row) => row.id != id);
          return [resp, ...filter];
        });
      })
    );
  }
  delete(id: string) {
    return this.http.delete<ClienteResponse>('cliente/' + id).pipe(
      tap((resp) => {
        this.listAll.update((list) => {
          const filter = list.filter((row) => row.id != id);
          return [...filter];
        });
      })
    );
  }

  private extractHistorialValue(resp: any): string {
    if (resp === null || resp === undefined) {
      return '-';
    }

    if (typeof resp === 'string') {
      const value = resp.trim();
      return value || '-';
    }

    if (Array.isArray(resp)) {
      if (!resp.length) {
        return '-';
      }

      const latest = [...resp].sort((a, b) => {
        const dateA = this.extractHistorialDate(a);
        const dateB = this.extractHistorialDate(b);
        return dateA - dateB;
      }).at(-1);

      return this.extractHistorialValue(latest);
    }

    const value =
      resp.valor ??
      resp.value ??
      resp.nombreComercial ??
      resp.razonSocial ??
      resp.nombre ??
      resp.descripcion ??
      resp.historial ??
      resp.data;

    if (typeof value === 'string') {
      const normalized = value.trim();
      return normalized || '-';
    }

    if (value !== undefined && value !== null) {
      return String(value);
    }

    return '-';
  }

  private extractHistorialDate(item: any): number {
    if (item === null || item === undefined) {
      return 0;
    }

    if (typeof item === 'string' || typeof item === 'number') {
      const parsed = new Date(item);
      return Number.isNaN(parsed.getTime()) ? 0 : parsed.getTime();
    }

    const rawDate =
      item.fecha ??
      item.createdAt ??
      item.updatedAt ??
      item.fechaCreacion ??
      item.fechaModificacion ??
      item.date ??
      item.timestamp;

    const parsed = new Date(rawDate);
    return Number.isNaN(parsed.getTime()) ? 0 : parsed.getTime();
  }
}
