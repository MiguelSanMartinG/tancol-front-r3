import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { DropdownModel } from '@shared/interface/dropdown.model';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class CommonService {

  condicionPago: DropdownModel[] = [
    {
      name: 'Contado',
      code: 'CONTADO',
    },
    {
      name: 'Crédito',
      code: 'CREDITO',
    },
    {
      name: 'Vales efectivo',
      code: 'VALE_EFECTIVO'
    },
    {
      name: 'Vales transferencia',
      code: 'VALE_TRANSFERENCIA'
    }
  ];

  getCondicionPago():DropdownModel[]{
    return this.condicionPago
  }

}
