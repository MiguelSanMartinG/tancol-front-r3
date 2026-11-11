import { Provider } from '@angular/core';
// import { Observable, of } from 'rxjs';

import { OrderReciboService } from './order-recibo.service';
// import { ExampleReturnType } from './example-return-type.model';
// import { MOCK_ExampleReturnType } from './example-return-type.model.mock';
// export const MOCK_ExampleReturnType: ExampleReturnType = {};

export const MOCK_OrderReciboService: OrderReciboService = {
  // method(): Observable<ExampleReturnType> {
  //  return of(MOCK_ExampleReturnType);
  // },
};

export const MOCK_OrderReciboServiceProvider: Provider = {
  provide: OrderReciboService,
  useValue: MOCK_OrderReciboService,
};
