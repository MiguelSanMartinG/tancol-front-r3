import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NotificacionesService } from '@app/core/services/notificaciones.service';

import { PrincipalComponent } from './principal.component';

describe('PrincipalComponent', () => {
  let component: PrincipalComponent;
  let fixture: ComponentFixture<PrincipalComponent>;
  const notificacionesService = jasmine.createSpyObj<NotificacionesService>('NotificacionesService', ['cargar', 'marcarComoLeida'], {
    notificaciones: () => [],
    pendientes: () => [],
    noLeidas: () => 0,
  });

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PrincipalComponent],
      providers: [{ provide: NotificacionesService, useValue: notificacionesService }]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PrincipalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('loads notifications on startup', () => {
    expect(notificacionesService.cargar).toHaveBeenCalled();
  });
});
