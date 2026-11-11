import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class CatalogoService {
  private baseUrl = ''; // Ajusta según tu backend

  constructor(private http: HttpClient) {}

  /**
   * Carga un catálogo (ej: tipoCliente, condicionesPago, canal, etc.)
   */
  getCatalogo(tipo: string): Observable<{ id: number; nombre: string }[]> {
    return this.http.get<{ id: number; nombre: string }[]>(`${tipo}`);
  }

  /**
   * Crea un nuevo elemento en el catálogo
   */
crearCatalogo(tipo: string, data: { nombre: string }): Observable<{ id: number; nombre: string }> {
  return this.http.post<{ id: number; nombre: string }>(`${tipo}`, data);
}
}
