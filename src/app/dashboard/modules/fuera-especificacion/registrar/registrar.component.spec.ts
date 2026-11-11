import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RegistrarFueraEspecificacionComponent } from './registrar.component';

describe('RegistrarFueraEspecificacionComponent', () => {
  let component: RegistrarFueraEspecificacionComponent;
  let fixture: ComponentFixture<RegistrarFueraEspecificacionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RegistrarFueraEspecificacionComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RegistrarFueraEspecificacionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
