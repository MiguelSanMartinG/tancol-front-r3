import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RegistrarAlmacenComponent } from './registrar.component';

describe('RegistrarComponent', () => {
  let component: RegistrarAlmacenComponent;
  let fixture: ComponentFixture<RegistrarAlmacenComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RegistrarAlmacenComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RegistrarAlmacenComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
