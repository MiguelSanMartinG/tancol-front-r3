import { CommonResponseDto } from '@core/common/common.response.dto';

export interface ProveedorResponseDto extends CommonResponseDto {
  idProveedor: string;
  nombreComercial: string;
  nombreTipoProveedor: string;
  idTipoProveedor?: string;
  tiposProveedor?: { id: string; nombre: string; alias: string }[];
  condicionPago: string;
  correo: string;
  telefono: string;
  infoFiscal: InfoFiscal;
  enabled: boolean;
}

export interface InfoFiscal {
  tipoContribuyente: string;
  razonSocial?: any;
  rfc: string;
  codigoPostal: string;
  tipoVialidad: string;
  nombreVialidad: string;
  numeroExterior: string;
  numeroInterior: string;
  colonia: string;
  localidad: string;
  municipio: string;
  entidadFederativa?: any;
  calle1?: any;
  calle2?: any;
}
