import { CommonModule } from '@angular/common';
import { NO_ERRORS_SCHEMA, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ActivatedRoute, Router } from '@angular/router';
import { EMPTY, of } from 'rxjs';
import { AppPrimengModule } from '@shared/app-primeng/app-primeng.module';
import { DatetimePipe } from '@shared/pipes/datetime.pipe';
import { CatalogoService } from '@shared/services/catalogo.service';
import { TipoClienteApiService } from '../../tipo-cliente/services/tipo-cliente.api.service';
import { ClienteApiService } from '../services/cliente.service';
import { PrincipalComponent } from './principal.component';

describe('Acciones secundarias de clientes', () => {
  let fixture: ComponentFixture<PrincipalComponent>;
  const navigate = jasmine.createSpy('navigate');
  const getHistorialPrecios = jasmine.createSpy('getHistorialPrecios');

  beforeEach(async () => {
    navigate.calls.reset();
    getHistorialPrecios.calls.reset();
    getHistorialPrecios.and.returnValue(of([]));
    await TestBed.configureTestingModule({
      imports: [PrincipalComponent, NoopAnimationsModule],
      providers: [
        { provide: Router, useValue: { navigate } },
        { provide: ActivatedRoute, useValue: {} },
        { provide: CatalogoService, useValue: {} },
        { provide: TipoClienteApiService, useValue: { getAll: () => EMPTY } },
        { provide: ClienteApiService, useValue: {
          listAll: signal(['cliente-1', 'cliente-2'].map(id => ({
            id, noCliente: id, nombreComercial: id,
            fechaAlta: '2026-09-01', createdAt: '2026-09-01',
          }))),
          getAll: () => EMPTY,
          getHistorialPrecios,
        } },
      ],
    }).overrideComponent(PrincipalComponent, {
      set: { imports: [CommonModule, AppPrimengModule, DatetimePipe], schemas: [NO_ERRORS_SCHEMA] },
    }).compileComponents();
    fixture = TestBed.createComponent(PrincipalComponent);
    fixture.detectChanges();
    await fixture.whenStable();
  });

  for (const [index, label] of ['Productos', 'Equipos', 'Historial de precios'].entries()) {
    it(`${label}: conserva la opción durante el enfoque y ejecuta el primer clic`, async () => {
      for (const row of [0, 1]) {
        const trigger = fixture.nativeElement.querySelectorAll('p-button[icon="pi pi-ellipsis-v"] button')[row] as HTMLButtonElement;
        trigger.click();
        fixture.detectChanges();
        await fixture.whenStable();
        const option = document.querySelectorAll<HTMLElement>('.p-menu-item-link')[index];
        expect(option.textContent).toContain(label);
        option.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
        option.focus();
        fixture.detectChanges();
        expect(option.isConnected).withContext('El enfoque no debe reemplazar el elemento antes del click').toBeTrue();
        option.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
        option.click();
        fixture.detectChanges();
        await fixture.whenStable();
        fixture.detectChanges();
        if (index < 2) {
          expect(navigate).toHaveBeenCalledWith(
            [index === 0 ? '../producto/' : '../equipos/', `cliente-${row + 1}`],
            { relativeTo: TestBed.inject(ActivatedRoute) },
          );
          expect(navigate.calls.count()).toBe(row + 1);
        } else {
          expect(getHistorialPrecios).toHaveBeenCalledOnceWith(`cliente-${row + 1}`);
          expect(document.querySelector('.p-dialog')).not.toBeNull();
          fixture.componentInstance.historialPreciosVisible = false;
          fixture.detectChanges();
          await fixture.whenStable();
          getHistorialPrecios.calls.reset();
        }
      }
    });
  }
});
