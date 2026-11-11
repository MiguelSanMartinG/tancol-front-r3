import { InventarioService } from './inventario.service';

describe('InventarioService', () => {
  const service: InventarioService = new InventarioService();

  it('should create', () => {
    expect(service).toBeTruthy();
  });
});
