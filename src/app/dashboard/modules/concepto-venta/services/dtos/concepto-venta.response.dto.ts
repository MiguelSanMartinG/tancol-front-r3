export interface ConceptoVentaResponseDto {
  id: string;
  concepto: string;
  name: string;
  descuento: boolean;
  exclude: boolean;
  enabled: boolean;
  createdAt?: string;
  updatedAt?: string;
  cancelado: boolean;
}
