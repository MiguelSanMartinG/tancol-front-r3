export interface ClienteDTO {
    comentario:string;
    correo?: string;
    diasDeCredito?: number;
    fechaAlta: string;
    idTipoDeCliente: string;
    informacionFiscal?: InformacionFiscal;
    nombreComercial: string;
    telefono?: string;
    tipoPago: string;
    idRuta: string;
  }
  
  export interface InformacionFiscal {
    calle1: string;
    calle2: string;
    codigoPostal: string;
    colonia: string;
    entidadFederativa: string;
    localidad: string;
    municipio: string;
    nombreVialidad: string;
    numeroExterior: string;
    numeroInterior: string;
    razonSocial: string;
    rfc: string;
    tipoContribuyente: string |null ;
    tipoVialidad: string;
  }