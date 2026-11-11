import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RegistrarProductoComponent } from './registrar.component';

describe('RegistrarComponent', () => {
  let component: RegistrarProductoComponent;
  let fixture: ComponentFixture<RegistrarProductoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RegistrarProductoComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RegistrarProductoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
