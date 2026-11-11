import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RegistrarTipoImpuestoComponent } from './registrar.component';

describe('RegistrarComponent', () => {
  let component: RegistrarTipoImpuestoComponent;
  let fixture: ComponentFixture<RegistrarTipoImpuestoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RegistrarTipoImpuestoComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RegistrarTipoImpuestoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
