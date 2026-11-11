import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BadgePrioridadOrdenComponent } from './badge-prioridad-orden.component';

describe('BadgePrioridadOrdenComponent', () => {
  let component: BadgePrioridadOrdenComponent;
  let fixture: ComponentFixture<BadgePrioridadOrdenComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BadgePrioridadOrdenComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BadgePrioridadOrdenComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
