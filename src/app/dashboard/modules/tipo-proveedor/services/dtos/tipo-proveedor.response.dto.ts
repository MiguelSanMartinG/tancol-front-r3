export interface TipoProveedorResponseDto{
  id: string;
  nombre: string;
  alias?: string;
  createdAt: string;
  updatedAt: string;
  enabled: boolean;
  proveedores: ProveedoresResponseDto[];
}

interface ProveedoresResponseDto{
  id: string;
  alias: string;
  razonSocial: string;
  enabled: boolean;
  createdAt: string;
  updatedAt?: any;
  tipoProveedor: string;
  informacionFiscal: InformacionFiscalResponseDto;  
}

interface InformacionFiscalResponseDto{
    rfc: string;
    tipoContribuyente: string;
    codigoPostal: string;
    tipoVialidad: string;
    nombreVialidad: string;
    numeroExterior: string;
    numeroInterior: string;
    colonia: string;
    localidad: string;
    municipio: string;
}