import { Injectable } from '@angular/core';
import { DropdownModel } from '@shared/interface/dropdown.model';

@Injectable({ providedIn: 'root' })
export class FiltroSolicitudCompraService {
  // constructor() {}

  setFilter(){
    return [
      {
        label:'Fecha inicio',
        type:'date',
        currentValue:'',
        options:[]
      }
    ]
  }

}

export interface FiltroSolicitudCompraModel{
  label:string;
  type:string;
  currentValue:string;
  options:any[]
}
