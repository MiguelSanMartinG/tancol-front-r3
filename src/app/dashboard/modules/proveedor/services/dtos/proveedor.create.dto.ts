export interface ProveedorCreateDto{
    condicionPago: string;
    correo: string;
    enabled: boolean;
    idsTipoProveedor: string[];
    idTipoProveedor?: string;
    informacionFiscal: InformacionFiscal;
    nombreComercial: string;
    telefono: string;
    // tipoContribuyente: string;
}

export interface InformacionFiscal {
    calle1:string;
    calle2:string;
    codigoPostal: string;
    colonia: string;
    entidadFederativa:string;
    localidad: string;
    municipio: string;
    nombreVialidad: string;
    numeroExterior: string;
    numeroInterior: string;
    razonSocial: string;
    rfc: string;
    tipoContribuyente: string;
    tipoVialidad: string;
  }
