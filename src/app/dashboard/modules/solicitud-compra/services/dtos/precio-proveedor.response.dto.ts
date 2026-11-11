export interface PrecioProveedorResponseDto {
    idPrecio: string;
    precio: number;
    productoEntity: ProductoEntity;
    proveedorEntity: ProveedorEntity;
    createdAt: string;
    updatedAt?: any;
  }
  
  export interface ProveedorEntity {
    idProveedor: string;
    nombreComercial: string;
    nombreTipoProveedor: string;
    idTipoProveedor: string;
    condicionPago: string;
    correo: string;
    telefono: string;
    infoFiscal: InfoFiscal;
    enabled: boolean;
    createdAt: string;
    updatedAt: string;
  }
  
  export interface InfoFiscal {
    tipoContribuyente: string;
    razonSocial: string;
    rfc: string;
    codigoPostal: string;
    tipoVialidad: string;
    nombreVialidad: string;
    numeroExterior: string;
    numeroInterior: string;
    colonia: string;
    localidad: string;
    municipio: string;
    entidadFederativa: string;
    calle1: string;
    calle2: string;
  }
  
  export interface ProductoEntity {
    idProducto: string;
    nombre: string;
    alias: string;
    descripcion: string;
    sku: string;
    nombreCategoria: string;
    createdAt: string;
    updatedAt?: any;
  }