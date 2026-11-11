import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { TabuladorBotellonesRotos, TabuladorBotellonesRotosRequest } from './tabulador-botellones-rotos.model';

@Injectable({ providedIn: 'root' })
export class TabuladorBotellonesRotosApiService {
  private http = inject(HttpClient);

  listar(filters: Record<string, string | boolean | undefined> = {}) {
    let params = new HttpParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== '') params = params.set(key, String(value));
    });
    return this.http.get<TabuladorBotellonesRotos[]>('tabulador-botellones-rotos', { params });
  }
  consultar(id: string) {
    return this.http.get<TabuladorBotellonesRotos>(`tabulador-botellones-rotos/${id}`);
  }
  crear(body: TabuladorBotellonesRotosRequest) {
    return this.http.post<TabuladorBotellonesRotos>('tabulador-botellones-rotos', body);
  }
  actualizar(id: string, body: TabuladorBotellonesRotosRequest) {
    return this.http.put<TabuladorBotellonesRotos>(`tabulador-botellones-rotos/${id}`, body);
  }
  eliminar(id: string) {
    return this.http.delete<void>(`tabulador-botellones-rotos/${id}`);
  }
}
