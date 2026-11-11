export function productoStockValido(value: {
  stockMinimo?: number | null;
  stockMaximo?: number | null;
  notificarStockMinimo?: boolean | null;
}): boolean {
  const { stockMinimo: min, stockMaximo: max } = value;
  return (min == null || Number.isFinite(min) && min >= 0) &&
    (max == null || Number.isFinite(max) && max >= 0) &&
    (min == null || max == null || max >= min) &&
    (!value.notificarStockMinimo || min != null);
}
