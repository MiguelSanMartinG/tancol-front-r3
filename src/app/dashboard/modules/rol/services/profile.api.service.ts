import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

export interface ProfileDto {
  idPerfil?: string;
  canCreate: boolean;
  canDelete: boolean;
  canRead: boolean;
  canUpdate: boolean;
  idModulo: string;
  idRol: number;
}



@Injectable({ providedIn: 'root' })
export class ProfileApiService {
  constructor(private http: HttpClient) {}

  url: string = 'Profile';

  create(body: ProfileDto) {
    return this.http.post<any>(this.url, body);
  }

  update(idPerfil: string, body: ProfileDto) {
    return this.http.put<any>(`${this.url}/${idPerfil}`, body);
  }

  getByRole(idRol: number) {
    return this.http.get<ProfileResponse[]>(`${this.url}?idRole=${idRol}`);
  }
}



export interface ProfileResponse{
  idPerfil: string;
  module: Module;
  role: Role;
  canRead: boolean;
  canWrite: boolean;
  canDelete: boolean;
  canUpdate: boolean;
}

export interface Role {
  id: number;
  name: string;
}

export interface Module {
  idModulo: string;
  name: string;
  ruta: string;
  parent?: any;
}
