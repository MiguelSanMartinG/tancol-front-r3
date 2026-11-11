export interface ConceptoVentaCreateDto {
  concepto: string;
  name: string;
  descuento: boolean;
  enabled: boolean;
  exclude: boolean;
  cancelado: boolean;
  x: boolean;
}