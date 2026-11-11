/* tslint:disable:no-unused-variable */

import { TestBed, async, inject } from '@angular/core/testing';
import { TablaDescuentosService } from './tabla-descuentos.service';

describe('Service: TablaDescuentos', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [TablaDescuentosService]
    });
  });

  it('should ...', inject([TablaDescuentosService], (service: TablaDescuentosService) => {
    expect(service).toBeTruthy();
  }));
});
