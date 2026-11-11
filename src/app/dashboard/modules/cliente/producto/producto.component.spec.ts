import { ProductoComponent } from './producto.component';

describe('ProductoComponent', () => {
  let component: ProductoComponent;

  beforeEach(() => {
    component = new ProductoComponent();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
