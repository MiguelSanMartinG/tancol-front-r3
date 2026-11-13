import { TestBed, discardPeriodicTasks, fakeAsync, flushMicrotasks, tick } from '@angular/core/testing';
import {
  APP_VERSION_POLL_MS,
  APP_VERSION_POLLING,
  AppVersionService,
  parseVersionPayload,
  shouldReloadForVersion,
} from './app-version.service';

// Respuestas simuladas que se resuelven en microtareas (deterministas también en fakeAsync).
function okResponse(body: unknown): Response {
  return { ok: true, status: 200, json: () => Promise.resolve(body) } as unknown as Response;
}
function statusResponse(status: number): Response {
  return { ok: false, status, json: () => Promise.resolve({}) } as unknown as Response;
}
function invalidJsonResponse(): Response {
  return { ok: true, status: 200, json: () => Promise.reject(new SyntaxError('Unexpected token')) } as unknown as Response;
}

/** Devuelve las respuestas en orden; los rechazos se crean al momento del fetch. */
function secuencia(...pasos: Array<Response | Error>) {
  let i = 0;
  return () => {
    const paso = pasos[Math.min(i++, pasos.length - 1)];
    return paso instanceof Error ? Promise.reject(paso) : Promise.resolve(paso);
  };
}

describe('parseVersionPayload / shouldReloadForVersion', () => {
  it('acepta solo un string no vacío en version', () => {
    expect(parseVersionPayload({ version: 'abc123' })).toBe('abc123');
    expect(parseVersionPayload({ version: '  abc  ' })).toBe('abc');
    expect(parseVersionPayload({ version: '' })).toBeNull();
    expect(parseVersionPayload({ version: '   ' })).toBeNull();
    expect(parseVersionPayload({ version: 12 })).toBeNull();
    expect(parseVersionPayload({})).toBeNull();
    expect(parseVersionPayload(null)).toBeNull();
    expect(parseVersionPayload('abc')).toBeNull();
  });

  it('recarga solo si las dos versiones existen y son distintas', () => {
    expect(shouldReloadForVersion('abc', 'abc')).toBeFalse();
    expect(shouldReloadForVersion('abc', 'def')).toBeTrue();
    expect(shouldReloadForVersion(null, 'def')).toBeFalse();
    expect(shouldReloadForVersion('abc', null)).toBeFalse();
    expect(shouldReloadForVersion(null, null)).toBeFalse();
  });
});

describe('AppVersionService', () => {
  let fetchSpy: jasmine.Spy;

  function crear(enabled: boolean): { service: AppVersionService; reload: jasmine.Spy } {
    TestBed.configureTestingModule({ providers: [{ provide: APP_VERSION_POLLING, useValue: enabled }] });
    const service = TestBed.inject(AppVersionService);
    const reload = spyOn(service as any, 'reload');
    return { service, reload };
  }

  beforeEach(() => {
    fetchSpy = spyOn(window, 'fetch');
  });

  afterEach(() => TestBed.resetTestingModule());

  it('en development no consulta version.json', () => {
    const { service } = crear(false);
    service.start();
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(service.currentBaseline()).toBeNull();
  });

  it('consulta assets/version.json relativo al base href, sin cache', async () => {
    const { service } = crear(true);
    fetchSpy.and.resolveTo(okResponse({ version: 'abc' }));
    await service.check();
    const [url, init] = fetchSpy.calls.mostRecent().args;
    expect(url).toBe(new URL('assets/version.json', document.baseURI).toString());
    expect(init).toEqual({ cache: 'no-store' });
  });

  it('el primer fetch guarda la versión y no recarga; la misma no recarga; otra sí', async () => {
    const { service, reload } = crear(true);
    fetchSpy.and.callFake(secuencia(okResponse({ version: 'abc' }), okResponse({ version: 'abc' }), okResponse({ version: 'def' })));

    await service.check();
    expect(service.currentBaseline()).toBe('abc');
    expect(reload).not.toHaveBeenCalled();

    await service.check();
    expect(reload).not.toHaveBeenCalled();

    await service.check();
    expect(reload).toHaveBeenCalledTimes(1);
  });

  it('HTTP no OK, JSON inválido o red caída no recargan ni pisan la versión guardada', async () => {
    const { service, reload } = crear(true);
    fetchSpy.and.callFake(
      secuencia(
        okResponse({ version: 'abc' }),
        statusResponse(503),
        invalidJsonResponse(),
        okResponse({ version: '' }),
        new TypeError('Failed to fetch'),
      ),
    );

    await service.check();
    for (let i = 0; i < 4; i++) await service.check();

    expect(service.currentBaseline()).toBe('abc');
    expect(reload).not.toHaveBeenCalled();
  });

  it('sin versión previa, un fallo no deja baseline', async () => {
    const { service, reload } = crear(true);
    fetchSpy.and.callFake(secuencia(new TypeError('Failed to fetch')));
    await service.check();
    expect(service.currentBaseline()).toBeNull();
    expect(reload).not.toHaveBeenCalled();
  });

  it('un check en curso no se solapa', async () => {
    const { service } = crear(true);
    let resolver!: (r: Response) => void;
    fetchSpy.and.returnValue(new Promise<Response>((r) => (resolver = r)));
    const primero = service.check();
    await service.check();
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    resolver(okResponse({ version: 'abc' }));
    await primero;
  });

  it('con la pestaña oculta el tick no consulta; al volver a visible consulta de inmediato', fakeAsync(() => {
    const { service } = crear(true);
    const visibility = spyOnProperty(document, 'visibilityState', 'get').and.returnValue('visible');
    fetchSpy.and.callFake(() => Promise.resolve(okResponse({ version: 'abc' })));

    service.start();
    flushMicrotasks();
    expect(fetchSpy).toHaveBeenCalledTimes(1); // check inicial

    visibility.and.returnValue('hidden');
    tick(APP_VERSION_POLL_MS);
    flushMicrotasks();
    expect(fetchSpy).toHaveBeenCalledTimes(1);

    visibility.and.returnValue('visible');
    document.dispatchEvent(new Event('visibilitychange'));
    flushMicrotasks();
    expect(fetchSpy).toHaveBeenCalledTimes(2);

    tick(APP_VERSION_POLL_MS);
    flushMicrotasks();
    expect(fetchSpy).toHaveBeenCalledTimes(3);

    service.start(); // idempotente: no agrega otro intervalo
    tick(APP_VERSION_POLL_MS);
    flushMicrotasks();
    expect(fetchSpy).toHaveBeenCalledTimes(4);

    discardPeriodicTasks();
  }));

  it('al destruir el injector limpia el intervalo y el listener', fakeAsync(() => {
    const { service } = crear(true);
    spyOnProperty(document, 'visibilityState', 'get').and.returnValue('visible');
    fetchSpy.and.callFake(() => Promise.resolve(okResponse({ version: 'abc' })));
    service.start();
    flushMicrotasks();

    TestBed.resetTestingModule();
    tick(APP_VERSION_POLL_MS);
    document.dispatchEvent(new Event('visibilitychange'));
    flushMicrotasks();
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  }));
});
