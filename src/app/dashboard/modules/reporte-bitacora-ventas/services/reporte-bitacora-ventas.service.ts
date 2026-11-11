import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface ReporteBitacoraVentasRequest {
  fechaInicio?: string;
  fechaFin?: string;
  folio?: string;
  rutas: string[];
  procesos: string[];
  choferes: string[];
  ayudantes: string[];
  productos: string[];
  vehiculos: string[];
  fechaFirma?: string;
  estadoVentaRuta?: string;
  rotos: boolean;
  rotoPorMaquina: boolean;
  fueraEspecificacion: boolean;
}

export interface ReporteBitacoraVentasItem {
  [key: string]: unknown;
  idBitacora?: string;
  folio?: string;
  ruta?: string;
  proceso?: string;
  chofer?: string;
  ayudante?: string;
  ayudantes?: string;
  producto?: string;
  vehiculo?: string;
  fechaFirma?: string;
  estadoVentaRuta?: string;
  horaLlegada?: string;
  cantidadLlegada?: number;
  cantidadSalida?: number;
  cantidadVendida?: number;
  rotos?: number;
  fueraEspecificacion?: number;
}

export interface ReporteBitacoraTripulacionRequest {
  fechaInicio: string;
  fechaFin: string;
  idRutas: string[];
  idChoferes: string[];
  idAyudantes: string[];
  idProductos: string[];
  idVehiculos: string[];
  procesos: string[];
  rotos: boolean;
  fueraEspecificacion: boolean;
}

export interface ReporteBitacoraTripulacionItem {
  fecha: string;
  nombreRuta: string;
  chofer: string;
  ayudantes: string;
  nombreProducto?: string;
  cantidadVendida?: number;
}

@Injectable({ providedIn: 'root' })
export class ReporteBitacoraVentasService {
  constructor(private readonly http: HttpClient) {}

  getReport(body: ReporteBitacoraVentasRequest): Observable<ReporteBitacoraVentasItem[] | { data?: ReporteBitacoraVentasItem[]; items?: ReporteBitacoraVentasItem[] }> {
    return this.http.post<ReporteBitacoraVentasItem[] | { data?: ReporteBitacoraVentasItem[]; items?: ReporteBitacoraVentasItem[] }>('reportes/bitacoras-ventas', body);
  }

  getTripulaciones(body: ReporteBitacoraTripulacionRequest): Observable<ReporteBitacoraTripulacionItem[]> {
    return this.http.post<ReporteBitacoraTripulacionItem[]>('reportes/bitacoras-ventas', body);
  }
}
