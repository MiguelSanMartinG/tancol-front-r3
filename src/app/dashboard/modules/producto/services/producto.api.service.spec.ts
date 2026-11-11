import { TestBed } from '@angular/core/testing';
import { HttpClient } from '@angular/common/http';
import { ProductoApiService } from './producto.api.service';
import { productoStockValido } from './producto-stock.validator';

describe('ProductoApiService stock validation', () => {
  let service: ProductoApiService;
  let http: jasmine.SpyObj<HttpClient>;

  beforeEach(() => {
    http = jasmine.createSpyObj<HttpClient>('HttpClient', ['get', 'post', 'put', 'delete']);
    TestBed.configureTestingModule({ providers: [ProductoApiService, { provide: HttpClient, useValue: http }] });
    service = TestBed.inject(ProductoApiService);
  });

  it('does not send create when stock alerts are on and minimum is missing', () => {
    service.create({ nombre: 'Producto', sku: '', alias: '', descripcion: '', categoriaProductoId: 'cat', unidadMedidaDefault: 'unidad', notificarStockMinimo: true, stockMinimo: null }).subscribe({ error: () => {} });
    expect(http.post).not.toHaveBeenCalled();
  });

  it('does not send update when stock alerts are on and minimum is missing', () => {
    service.update({ notificarStockMinimo: true, stockMinimo: null }, 'producto-id').subscribe({ error: () => {} });
    expect(http.put).not.toHaveBeenCalled();
  });

  it('rejects negative minimum or maximum stock', () => {
    expect(productoStockValido({ stockMinimo: -1 })).toBeFalse();
    expect(productoStockValido({ stockMaximo: -1 })).toBeFalse();
  });

  it('rejects a maximum below the minimum', () => {
    expect(productoStockValido({ stockMinimo: 10, stockMaximo: 9 })).toBeFalse();
  });

  it('allows missing stock values when notifications are disabled', () => {
    expect(productoStockValido({ notificarStockMinimo: false, stockMinimo: null, stockMaximo: null })).toBeTrue();
  });

  it('allows zero stock thresholds and maximum equal to minimum', () => {
    expect(productoStockValido({ stockMinimo: 0, stockMaximo: 0, notificarStockMinimo: true })).toBeTrue();
  });
});
