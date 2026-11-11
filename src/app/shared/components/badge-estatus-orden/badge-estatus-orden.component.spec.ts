import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BadgeEstatusOrdenComponent } from './badge-estatus-orden.component';

describe('BadgeEstatusOrdenComponent', () => {
  let component: BadgeEstatusOrdenComponent;
  let fixture: ComponentFixture<BadgeEstatusOrdenComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BadgeEstatusOrdenComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BadgeEstatusOrdenComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
