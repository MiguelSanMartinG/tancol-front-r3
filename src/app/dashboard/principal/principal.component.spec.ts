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

  const crear = async (profiles: unknown[]) => {
    localStorage.setItem('profiles', JSON.stringify(profiles));
    notificacionesService.cargar.calls.reset();
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
  };

  let profilesPrevios: string | null;
  beforeEach(() => (profilesPrevios = localStorage.getItem('profiles')));
  afterEach(() => {
    if (profilesPrevios === null) localStorage.removeItem('profiles');
    else localStorage.setItem('profiles', profilesPrevios);
  });

  it('should create', async () => {
    await crear([]);
    expect(component).toBeTruthy();
  });

  it('loads notifications on startup when the profile can read notificaciones', async () => {
    await crear([{ canRead: true, module: { ruta: '/notificaciones' } }]);
    expect(component.puedeVerNotificaciones).toBeTrue();
    expect(notificacionesService.cargar).toHaveBeenCalled();
    expect(fixture.nativeElement.querySelector('details.notifications')).not.toBeNull();
  });

  it('hides the bell and skips loading without canRead on notificaciones', async () => {
    await crear([{ canRead: false, canWrite: true, module: { ruta: '/notificaciones' } }]);
    expect(component.puedeVerNotificaciones).toBeFalse();
    expect(notificacionesService.cargar).not.toHaveBeenCalled();
    expect(fixture.nativeElement.querySelector('details.notifications')).toBeNull();
  });
});
