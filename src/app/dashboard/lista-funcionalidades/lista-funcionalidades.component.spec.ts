import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ListaFuncionalidadesComponent } from './lista-funcionalidades.component';

describe('ListaFuncionalidadesComponent', () => {
  let component: ListaFuncionalidadesComponent;
  let fixture: ComponentFixture<ListaFuncionalidadesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ListaFuncionalidadesComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ListaFuncionalidadesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
