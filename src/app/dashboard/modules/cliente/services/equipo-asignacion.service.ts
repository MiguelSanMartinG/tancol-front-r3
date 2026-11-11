import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { tap } from 'rxjs';

export interface EquipoDisponible {
  id: string;
  nombre: string;
  sku: string;
  marca?: string;
  modelo?: string;
  estado: string;
}

export interface EquipoAsignacion {
  id: string;
  equipo: EquipoDisponible;
  fechaAsignacion: string;
  fechaDevolucion?: string | null;
  montoMinimo: number;
  periodoCobertura: 'SEMANAL' | 'QUINCENAL' | 'MENSUAL' | 'ANUAL';
  activa: boolean;
}

export interface CoberturaNoCubierta {
  asignacionId: string;
  clienteId: string;
  clienteNombre: string;
  equipoId: string;
  equipoNombre: string;
  montoMinimo: number;
  montoCubierto: number;
  cubierto: boolean;
  periodoInicio: string;
  periodoFin: string;
}

export interface RevisionCobertura {
  periodoInicio: string;
  periodoFin: string;
  ejecutadoEn: string;
  totalEvaluadas: number;
  totalNoCubiertas: number;
  destinatariosEncontrados: number;
  notificacionesGeneradas: number;
  noCubiertas: CoberturaNoCubierta[];
}

@Injectable({ providedIn: 'root' })
export class EquipoAsignacionService {
  constructor(private http: HttpClient) {}

  equiposDisponibles() {
    return this.http.get<EquipoDisponible[]>('equipo?estado=DISPONIBLE');
  }

  asignaciones(idCliente: string) {
    return this.http.get<EquipoAsignacion[]>(`equipo-asignacion?idCliente=${idCliente}`);
  }

  asignar(body: { idEquipo: string; idCliente: string; montoMinimo: number }) {
    return this.http.post<EquipoAsignacion>('equipo-asignacion', body);
  }

  devolver(id: string) {
    return this.http.put<EquipoAsignacion>(`equipo-asignacion/${id}/devolver`, {});
  }

  revisarCobertura() {
    return this.http.post<RevisionCobertura>('equipo-asignacion/revisar-cobertura', {});
  }
}
