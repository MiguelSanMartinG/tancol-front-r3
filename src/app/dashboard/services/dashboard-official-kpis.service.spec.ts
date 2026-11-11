import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { DashboardOfficialKpisService } from './dashboard-official-kpis.service';

describe('DashboardOfficialKpisService', () => {
  let service: DashboardOfficialKpisService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(DashboardOfficialKpisService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('requires an inclusive date range and defaults limit to 10', () => {
    service.getOfficial('2026-08-01', '2026-08-31').subscribe();
    const request = http.expectOne((req) => req.url === 'dashboard/kpis/official');
    expect(request.request.params.get('fechaInicio')).toBe('2026-08-01');
    expect(request.request.params.get('fechaFin')).toBe('2026-08-31');
    expect(request.request.params.get('limit')).toBe('10');
    request.flush({});
  });

  it('rejects a limit above 100 without sending a request', () => {
    let errors = 0;
    service.getOfficial('2026-08-01', '2026-08-31', 101).subscribe({ error: () => errors++ });
    expect(errors).toBe(1);
    http.expectNone((req) => req.url === 'dashboard/kpis/official');
  });

  it('sends a valid custom limit unchanged', () => {
    service.getOfficial('2026-08-01', '2026-08-31', 25).subscribe();
    const request = http.expectOne((req) => req.url === 'dashboard/kpis/official');
    expect(request.request.params.get('limit')).toBe('25');
    request.flush({});
  });

  it('does not send a request for invalid or reversed dates', () => {
    let errors = 0;
    service.getOfficial('2026-02-30', '2026-02-01').subscribe({ error: () => errors++ });
    expect(errors).toBe(1);
    http.expectNone((req) => req.url === 'dashboard/kpis/official');
  });
});
