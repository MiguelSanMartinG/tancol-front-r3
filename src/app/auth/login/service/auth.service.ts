import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { tap } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AuthService {

  constructor(private http: HttpClient) {}

  auth(request:AuthDTO){
    return this.http.post<any>('auth/login', request);
  }

}


export interface AuthDTO{
  contrasena: string;
  nombreUsuario: string;
}

export interface AuthResponse{
  token: string;
  idEmpleado: string;
  expiresIn: number;
  nombre: string;
  apellidoPaterno?: any;
}