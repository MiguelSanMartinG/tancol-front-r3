import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StatusBinaryReadOnlyComponent } from './status-binary-read-only.component';

describe('StatusBinaryReadOnlyComponent', () => {
  let component: StatusBinaryReadOnlyComponent;
  let fixture: ComponentFixture<StatusBinaryReadOnlyComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StatusBinaryReadOnlyComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(StatusBinaryReadOnlyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
