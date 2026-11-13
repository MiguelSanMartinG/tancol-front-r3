import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { DialogErrorService } from '@shared/components/error-modal/dialog-error.service';
import {
  CHUNK_FLAG_CLEAR_MS,
  CHUNK_RELOAD_KEY,
  ChunkReloadService,
  NUEVA_VERSION_STATUS,
  isChunkLoadError,
} from './chunk-reload.service';

describe('isChunkLoadError', () => {
  it('reconoce los errores de chunk', () => {
    const chunk = new Error('x');
    chunk.name = 'ChunkLoadError';
    expect(isChunkLoadError(chunk)).toBeTrue();
    expect(isChunkLoadError(new Error('Loading chunk 123 failed.'))).toBeTrue();
    expect(isChunkLoadError(new TypeError('Failed to fetch dynamically imported module: https://x/chunk-ABC.js'))).toBeTrue();
    expect(isChunkLoadError(new TypeError('error loading dynamically imported module'))).toBeTrue();
    expect(isChunkLoadError(new TypeError('Importing a module script failed.'))).toBeTrue();
  });

  it('ignora otros errores', () => {
    expect(isChunkLoadError(new Error('Cannot read properties of undefined'))).toBeFalse();
    expect(isChunkLoadError(null)).toBeFalse();
    expect(isChunkLoadError(undefined)).toBeFalse();
  });
});

describe('ChunkReloadService', () => {
  const chunkError = () => new TypeError('Failed to fetch dynamically imported module: https://x/chunk-ABC.js');
  let service: ChunkReloadService;
  let reload: jasmine.Spy;
  let dialog: DialogErrorService;

  function crear(routes = [] as any[]) {
    TestBed.configureTestingModule({ providers: [provideRouter(routes)] });
    service = TestBed.inject(ChunkReloadService);
    dialog = TestBed.inject(DialogErrorService);
    reload = spyOn(service as any, 'reload');
  }

  beforeEach(() => sessionStorage.removeItem(CHUNK_RELOAD_KEY));
  afterEach(() => {
    sessionStorage.removeItem(CHUNK_RELOAD_KEY);
    TestBed.resetTestingModule();
  });

  it('un error que no es de chunk se ignora', () => {
    crear();
    expect(service.handleError(new Error('otro'))).toBeFalse();
    expect(reload).not.toHaveBeenCalled();
    expect(sessionStorage.getItem(CHUNK_RELOAD_KEY)).toBeNull();
  });

  it('el primer fallo recarga una vez; el segundo no recarga y muestra el aviso', () => {
    crear();
    service.handleError(chunkError());
    expect(reload).toHaveBeenCalledTimes(1);
    expect(sessionStorage.getItem(CHUNK_RELOAD_KEY)).toBe('1');
    expect(dialog.display()).toBeFalse();

    // Tras el reload, el mismo chunk vuelve a fallar.
    service.handleError(chunkError());
    expect(reload).toHaveBeenCalledTimes(1);
    expect(sessionStorage.getItem(CHUNK_RELOAD_KEY)).toBeNull();
    expect(dialog.display()).toBeTrue();
    expect(dialog.dataError()?.status).toBe(NUEVA_VERSION_STATUS);
  });

  it('escucha NavigationError del Router', async () => {
    crear([{ path: 'perdido', loadComponent: () => Promise.reject(chunkError()) }]);
    service.start();
    await TestBed.inject(Router).navigateByUrl('/perdido').catch(() => undefined);
    expect(reload).toHaveBeenCalledTimes(1);
  });

  it('si el boot termina bien con el flag puesto, lo borra a los 10 s', fakeAsync(() => {
    sessionStorage.setItem(CHUNK_RELOAD_KEY, '1');
    crear();
    service.start();
    tick(CHUNK_FLAG_CLEAR_MS - 1);
    expect(sessionStorage.getItem(CHUNK_RELOAD_KEY)).toBe('1');
    tick(1);
    expect(sessionStorage.getItem(CHUNK_RELOAD_KEY)).toBeNull();
  }));

  it('si sessionStorage falla no revienta', () => {
    crear();
    spyOn(Storage.prototype, 'getItem').and.throwError('bloqueado');
    spyOn(Storage.prototype, 'setItem').and.throwError('bloqueado');
    expect(() => service.handleError(chunkError())).not.toThrow();
  });
});
