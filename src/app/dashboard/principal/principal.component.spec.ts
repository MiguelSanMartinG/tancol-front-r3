import { computed, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Notificacion, NotificacionesService } from '@app/core/services/notificaciones.service';

import { PrincipalComponent } from './principal.component';

describe('PrincipalComponent', () => {
  let component: PrincipalComponent;
  let fixture: ComponentFixture<PrincipalComponent>;
  const notificaciones = signal<Notificacion[]>([]);
  const notificacionesService = jasmine.createSpyObj<NotificacionesService>('NotificacionesService', ['cargar', 'marcarComoLeida', 'marcarTodasComoLeidas'], {
    notificaciones,
    pendientes: computed(() => notificaciones().filter((item) => !item.leida)),
    noLeidas: computed(() => notificaciones().filter((item) => !item.leida).length),
  });

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PrincipalComponent],
      providers: [
        { provide: NotificacionesService, useValue: notificacionesService },
        provideRouter([]),
      ]
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
