import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class TablaDescuentosService {

constructor(
  private http: HttpClient
) { }

create(body: TablaDescuentosRequestDto) {
    return this.http.post('tabla-descuentos', body);
}

getUltimoDescuento() {
    return this.http.get<TablaDescuentosResponse>('tabla-descuentos/latest');

}
}


export interface TablaDescuentosRequestDto{
  cuentaA:number;
  cuentaB:number;
  cuentaC:number;
}

export interface TablaDescuentosResponse{
  a1:number;
  a2:number;
  a3:number;
}
