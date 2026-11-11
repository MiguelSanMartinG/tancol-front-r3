import { Provider } from '@angular/core';
// import { Observable, of } from 'rxjs';

import { InventarioService } from './inventario.service';
// import { ExampleReturnType } from './example-return-type.model';
// import { MOCK_ExampleReturnType } from './example-return-type.model.mock';
// export const MOCK_ExampleReturnType: ExampleReturnType = {};

export const MOCK_InventarioService: InventarioService = {
  // method(): Observable<ExampleReturnType> {
  //  return of(MOCK_ExampleReturnType);
  // },
};

export const MOCK_InventarioServiceProvider: Provider = {
  provide: InventarioService,
  useValue: MOCK_InventarioService,
};
