export type Tono = 'blue' | 'purple' | 'green' | 'orange';

export interface SeccionNav {
  key: number;
  label: string;
  icon: string;
  parent: string;
  subtitle: string;
  noun: string;
}

export interface GrupoNav {
  id: string;
  section: number;
  label: string;
  chip: string;
  tone: Tono;
}

export interface Funcionalidad {
  label: string;
  description: string;
  icon: string;
  route: string;
  active: boolean;
  iconPending?: boolean;
  group: string;
  section: number;
  tone: Tono;
}

export const SECCIONES: SeccionNav[] = [
  {
    key: 1,
    label: 'Catálogos',
    icon: 'pi pi-folder',
    parent: 'Catálogos',
    subtitle: 'Administra los recursos de tu operación',
    noun: 'catálogo',
  },
  {
    key: 2,
    label: 'Operación',
    icon: 'pi pi-megaphone',
    parent: 'Operación',
    subtitle: 'Registra compras, inventario y ventas',
    noun: 'módulo',
  },
  {
    key: 3,
    label: 'Configuración',
    icon: 'pi pi-cog',
    parent: 'Configuración',
    subtitle: 'Ajusta tipos, permisos y parámetros',
    noun: 'módulo',
  },
  {
    key: 4,
    label: 'Reportes',
    icon: 'pi pi-chart-bar',
    parent: 'Reportes',
    subtitle: 'Consulta indicadores y movimientos',
    noun: 'reporte',
  },
];

export const GRUPOS: GrupoNav[] = [
  { id: 'recursos', section: 1, label: 'Recursos', chip: 'Recursos', tone: 'blue' },
  { id: 'personas', section: 1, label: 'Personas y contactos', chip: 'Personas', tone: 'purple' },
  { id: 'inventario', section: 1, label: 'Inventario', chip: 'Inventario', tone: 'green' },
  { id: 'distribucion', section: 1, label: 'Distribución', chip: 'Distribución', tone: 'orange' },
  { id: 'compras', section: 2, label: 'Compras', chip: 'Compras', tone: 'blue' },
  { id: 'almacen-op', section: 2, label: 'Almacén', chip: 'Almacén', tone: 'green' },
  { id: 'ventas-op', section: 2, label: 'Ventas', chip: 'Ventas', tone: 'orange' },
  { id: 'acceso', section: 3, label: 'Acceso y cuentas', chip: 'Acceso', tone: 'purple' },
  { id: 'tipos', section: 3, label: 'Tipos', chip: 'Tipos', tone: 'blue' },
  { id: 'productos', section: 3, label: 'Productos e inventario', chip: 'Productos', tone: 'green' },
  { id: 'parametros', section: 3, label: 'Parámetros', chip: 'Parámetros', tone: 'orange' },
  { id: 'indicadores', section: 4, label: 'Indicadores', chip: 'Indicadores', tone: 'blue' },
  { id: 'consumo', section: 4, label: 'Consumo y material', chip: 'Consumo', tone: 'green' },
  { id: 'ventas-rep', section: 4, label: 'Ventas', chip: 'Ventas', tone: 'orange' },
];

export const FAVORITOS_INICIALES = ['./clientes', './nuestros-productos', './rutas'];

const item = (
  partial: Omit<Funcionalidad, 'active'> & { active?: boolean }
): Funcionalidad => ({ active: true, ...partial });

export const CATALOGOS: Funcionalidad[] = [
  item({
    label: 'Equipos',
    description: 'Administra los equipos de tu operación.',
    icon: '/icon-custom/Iconos/Catálogos/cat-equipos.svg',
    route: './equipo',
    group: 'recursos',
    section: 1,
    tone: 'blue',
  }),
  item({
    label: 'Departamentos',
    description: 'Organiza la estructura de tu empresa.',
    icon: '/icon-custom/Iconos/Catálogos/cat-departamentos.svg',
    route: './departamentos',
    group: 'recursos',
    section: 1,
    tone: 'blue',
  }),
  item({
    label: 'Medidores',
    description: 'Gestiona los medidores de tu operación.',
    icon: '/icon-custom/Iconos/Catálogos/cat-medidores.svg',
    route: './medidores',
    group: 'recursos',
    section: 1,
    tone: 'blue',
  }),
  item({
    label: 'Clientes',
    description: 'Administra la información de tus clientes.',
    icon: '/icon-custom/Iconos/Catálogos/cat-clientes.svg',
    route: './clientes',
    group: 'personas',
    section: 1,
    tone: 'purple',
  }),
  item({
    label: 'Proveedores',
    description: 'Gestiona tus proveedores y aliados.',
    icon: '/icon-custom/Iconos/Catálogos/cat-proveedores.svg',
    route: './proveedor',
    group: 'personas',
    section: 1,
    tone: 'purple',
  }),
  item({
    label: 'Empleados',
    description: 'Administra el personal de tu empresa.',
    icon: '/icon-custom/Iconos/Catálogos/cat-empleados.svg',
    route: './empleados',
    group: 'personas',
    section: 1,
    tone: 'purple',
  }),
  item({
    label: 'Almacenes',
    description: 'Gestiona tus almacenes y ubicaciones.',
    icon: '/icon-custom/Iconos/Catálogos/cat-almacenes.svg',
    route: './almacen',
    group: 'inventario',
    section: 1,
    tone: 'green',
  }),
  item({
    label: 'Insumos',
    description: 'Administra los insumos de tu operación.',
    icon: '/icon-custom/Iconos/Catálogos/cat-insumos.svg',
    route: './isumos',
    group: 'inventario',
    section: 1,
    tone: 'green',
  }),
  item({
    label: 'Productos Tancol',
    description: 'Gestiona los productos Tancol.',
    icon: '/icon-custom/Iconos/Catálogos/cat-productosTancol.svg',
    route: './nuestros-productos',
    group: 'inventario',
    section: 1,
    tone: 'green',
  }),
  item({
    label: 'Vehículos',
    description: 'Administra tu flota de vehículos.',
    icon: '/icon-custom/Iconos/Catálogos/cat-vehiculos.svg',
    route: './vehiculos',
    group: 'distribucion',
    section: 1,
    tone: 'orange',
  }),
  item({
    label: 'Rutas',
    description: 'Gestiona las rutas de distribución.',
    icon: '/icon-custom/Iconos/Catálogos/cat-rutas.svg',
    route: './rutas',
    group: 'distribucion',
    section: 1,
    tone: 'orange',
  }),
];

export const OPERACION: Funcionalidad[] = [
  item({
    label: 'Solicitud de compra',
    description: 'Registra las solicitudes de compra de la operación.',
    icon: '/icon-custom/Iconos/Operación/oper-solicitudCompra.svg',
    route: './solicitud-compra',
    group: 'compras',
    section: 2,
    tone: 'blue',
  }),
  item({
    label: 'Órdenes de compra',
    description: 'Da seguimiento a las órdenes de compra.',
    icon: '/icon-custom/Iconos/Operación/oper-ordenCompra.svg',
    route: './orden-compra',
    group: 'compras',
    section: 2,
    tone: 'blue',
  }),
  item({
    label: 'Recepción de compras',
    description: 'Recibe y valida las compras ingresadas.',
    icon: '/icon-custom/Iconos/Operación/oper-recepcionCompra.svg',
    route: './recepcion-compra',
    group: 'compras',
    section: 2,
    tone: 'blue',
  }),
  item({
    label: 'Inventario general',
    description: 'Consulta el inventario de la operación.',
    icon: '/icon-custom/Iconos/Operación/oper-inventarioGeneral.svg',
    route: './inventario',
    group: 'almacen-op',
    section: 2,
    tone: 'green',
  }),
  item({
    label: 'Salida de material',
    description: 'Registra las salidas de material.',
    icon: '/icon-custom/Iconos/Operación/oper-salidaMaterial.svg',
    route: './salida-material',
    group: 'almacen-op',
    section: 2,
    tone: 'green',
  }),
  item({
    label: 'Transferencias entre almacenes',
    description: 'Mueve existencias entre almacenes.',
    icon: '/icon-custom/Iconos/Operación/oper-transferenciaAlmacenes.svg',
    route: './transferencias',
    group: 'almacen-op',
    section: 2,
    tone: 'green',
  }),
  item({
    label: 'Liquidaciones',
    description: 'Administra las liquidaciones de ruta.',
    icon: '/icon-custom/Iconos/Operación/oper-liquidaciones.svg',
    route: './liquidacion',
    group: 'ventas-op',
    section: 2,
    tone: 'orange',
  }),
  item({
    label: 'Bitácora de ventas',
    description: 'Consulta la bitácora de ventas.',
    icon: '/icon-custom/Iconos/Operación/oper-bitacoraVentas.svg',
    route: './bitacora-ventas',
    group: 'ventas-op',
    section: 2,
    tone: 'orange',
  }),
];

export const CONFIGURACION: Funcionalidad[] = [
  item({
    label: 'Permisos avanzados',
    description: 'Define qué puede hacer cada rol.',
    icon: '/icon-custom/Iconos/Configuración/cnf-permisosAvanzados.svg',
    route: './permisos-avanzados',
    group: 'acceso',
    section: 3,
    tone: 'purple',
  }),
  item({
    label: 'Roles de empleados',
    description: 'Administra los roles del personal.',
    icon: '/icon-custom/Iconos/Configuración/cnf-rolesEmpleados.svg',
    route: './rol',
    group: 'acceso',
    section: 3,
    tone: 'purple',
  }),
  item({
    label: 'Módulos',
    description: 'Configura los módulos del sistema.',
    icon: '/icon-custom/Iconos/Configuración/cnf-modulos.svg',
    route: './modulos',
    group: 'acceso',
    section: 3,
    tone: 'purple',
  }),
  item({
    label: 'Cuentas',
    description: 'Administra las cuentas de acceso.',
    icon: '/icon-custom/Iconos/Configuración/cnf-cuentas.svg',
    route: './cuentas',
    group: 'acceso',
    section: 3,
    tone: 'purple',
  }),
  item({
    label: 'Tipo de proveedores',
    description: 'Clasifica los tipos de proveedor.',
    icon: '/icon-custom/Iconos/Configuración/cnf-tipoProveedores.svg',
    route: './tipo-proveedor',
    group: 'tipos',
    section: 3,
    tone: 'blue',
  }),
  item({
    label: 'Tipo de clientes',
    description: 'Clasifica los tipos de cliente.',
    icon: '/icon-custom/Iconos/Configuración/cnf-tipoClientes.svg',
    route: './tipo-cliente',
    group: 'tipos',
    section: 3,
    tone: 'blue',
  }),
  item({
    label: 'Tipos de equipo',
    description: 'Define los tipos de equipo.',
    icon: '/icon-custom/Iconos/Configuración/cnf-tipoEquipos.svg',
    route: './tipo-equipo',
    group: 'tipos',
    section: 3,
    tone: 'blue',
  }),
  item({
    label: 'Tipo de empleados',
    description: 'Clasifica los tipos de empleado.',
    icon: '/icon-custom/Iconos/Configuración/cnf-tipoEmpleados.svg',
    route: './tipo-empleado',
    group: 'tipos',
    section: 3,
    tone: 'blue',
  }),
  item({
    label: 'Tipo de impuesto',
    description: 'Configura los impuestos de la operación.',
    icon: '/icon-custom/Iconos/Configuración/cnf-tipoImpuesto.svg',
    route: './tipo-impuesto',
    group: 'tipos',
    section: 3,
    tone: 'blue',
  }),
  item({
    label: 'Categoría de insumos',
    description: 'Organiza las categorías de insumos.',
    icon: '/icon-custom/Iconos/Configuración/cnf-categoriaInsumos.svg',
    route: './categoria-producto',
    group: 'productos',
    section: 3,
    tone: 'green',
  }),
  item({
    label: 'Categorías productos Tancol',
    description: 'Organiza las categorías de productos Tancol.',
    icon: '/icon-custom/Iconos/Configuración/cnf-categoriaProductosTancol.svg',
    route: './categorias-nuestros-productos',
    group: 'productos',
    section: 3,
    tone: 'green',
  }),
  item({
    label: 'Unidades de medida',
    description: 'Define las unidades de medida.',
    icon: '/icon-custom/Iconos/Configuración/cnf-unidadesMedida.svg',
    route: './unidad-medida',
    group: 'productos',
    section: 3,
    tone: 'green',
  }),
  item({
    label: 'Sistemas de almacenamiento',
    description: 'Configura los sistemas de almacenamiento.',
    icon: '/icon-custom/Iconos/Configuración/cnf-sistemaAlmacenamiento.svg',
    route: './sistemas-almacenamiento',
    group: 'productos',
    section: 3,
    tone: 'green',
  }),
  item({
    label: 'Inventario inicial',
    description: 'Carga el inventario inicial.',
    icon: '/icon-custom/Iconos/Configuración/cnf-inventarioInicial.svg',
    route: './inventario-inicial',
    group: 'productos',
    section: 3,
    tone: 'green',
  }),
  item({
    label: 'Fuera de especificación',
    description: 'Administra los motivos fuera de especificación.',
    icon: '/icon-custom/Iconos/Configuración/cnf-fueraEspecificacion.svg',
    route: './fuera-especificacion',
    group: 'parametros',
    section: 3,
    tone: 'orange',
  }),
  item({
    label: 'Tablas de amonestación',
    description: 'Configura las tablas de amonestación.',
    icon: '/icon-custom/Iconos/Configuración/cnf-conceptosVenta.svg',
    route: './tablas-amonestaciones',
    iconPending: true,
    group: 'parametros',
    section: 3,
    tone: 'orange',
  }),
  item({
    label: 'Conceptos de venta',
    description: 'Define los conceptos usados en ventas.',
    icon: '/icon-custom/Iconos/Configuración/cnf-conceptosVenta.svg',
    route: './concepto-venta',
    group: 'parametros',
    section: 3,
    tone: 'orange',
  }),
  item({
    label: 'Configurar KPIs',
    description: 'Elige los indicadores del dashboard.',
    icon: '/icon-custom/Iconos/Configuración/cnf-configurarKpi.svg',
    route: './configuracion-kpis',
    group: 'parametros',
    section: 3,
    tone: 'orange',
  }),
];

export const REPORTES: Funcionalidad[] = [
  item({
    label: 'Dashboard mensual',
    description: 'Revisa los indicadores del mes.',
    icon: '/icon-custom/Iconos/Reportes/rep-general.svg',
    route: './dashboard-reportes',
    group: 'indicadores',
    section: 4,
    tone: 'blue',
  }),
  item({
    label: 'Chequeo manual de cobertura',
    description: 'Comprueba la cobertura de forma manual.',
    icon: '/icon-custom/Iconos/Reportes/rep-chequeoCobertura.svg',
    route: './chequeo-cobertura',
    group: 'indicadores',
    section: 4,
    tone: 'blue',
  }),
  item({
    label: 'Notificaciones',
    description: 'Consulta las notificaciones del sistema.',
    icon: '/icon-custom/Iconos/Reportes/rep-notificacion.svg',
    route: './notificaciones',
    group: 'indicadores',
    section: 4,
    tone: 'blue',
  }),
  item({
    label: 'Consumo de clientes',
    description: 'Analiza el consumo por cliente.',
    icon: '/icon-custom/Iconos/Reportes/rep-consumoClientes.svg',
    route: './reporte-consumo-clientes',
    group: 'consumo',
    section: 4,
    tone: 'green',
  }),
  item({
    label: 'Salida de material',
    description: 'Revisa las salidas de material.',
    icon: '/icon-custom/Iconos/Reportes/rep-salidaMaterial.svg',
    route: './reporte-salida-material',
    group: 'consumo',
    section: 4,
    tone: 'green',
  }),
  item({
    label: 'Reporte de liquidacion',
    description: 'Consulta las liquidaciones registradas.',
    icon: '/icon-custom/Iconos/Reportes/rep-liquidacion.svg',
    route: './reporte-liquidaciones',
    group: 'consumo',
    section: 4,
    tone: 'green',
  }),
  item({
    label: 'Reporte de Consumo por Área y Producto',
    description: 'Compara el consumo por área y producto.',
    icon: '/icon-custom/Iconos/Reportes/rep-consumoClientes.svg',
    route: './reporte-consumo-area-producto',
    iconPending: true,
    group: 'consumo',
    section: 4,
    tone: 'green',
  }),
  item({
    label: 'Reporte de movimientos',
    description: 'Revisa los movimientos de la bitácora.',
    icon: '/icon-custom/Iconos/Reportes/rep-movimientos.svg',
    route: './reporte-bitacora-ventas',
    group: 'consumo',
    section: 4,
    tone: 'green',
  }),
  item({
    label: 'Reporte de cuentas',
    description: 'Consulta el estado de las cuentas.',
    icon: '/icon-custom/Iconos/Reportes/rep-cuentas.svg',
    route: './reporte-cuentas',
    group: 'consumo',
    section: 4,
    tone: 'green',
  }),
  item({
    label: 'Ventas por empleado',
    description: 'Mide las ventas de cada empleado.',
    icon: '/icon-custom/Iconos/Reportes/rep-ventasEmpleado.svg',
    route: './reporte-volumen-ventas-empleado',
    group: 'ventas-rep',
    section: 4,
    tone: 'orange',
  }),
  item({
    label: 'Venta semanal por chofer',
    description: 'Revisa la venta semanal de cada chofer.',
    icon: '/icon-custom/Iconos/Reportes/rep-ventasEmpleado.svg',
    route: './reporte-ventas-semanal-chofer',
    iconPending: true,
    group: 'ventas-rep',
    section: 4,
    tone: 'orange',
  }),
  item({
    label: 'Ventas por empleado por día',
    description: 'Detalle diario de ventas por empleado.',
    icon: '/icon-custom/Iconos/Reportes/rep-ventasEmpleadoDia.svg',
    route: './reporte-volumen-ventas-empleado-dia',
    group: 'ventas-rep',
    section: 4,
    tone: 'orange',
  }),
  item({
    label: 'Ventas por cliente',
    description: 'Mide las ventas de cada cliente.',
    icon: '/icon-custom/Iconos/Reportes/rep-ventasClientes.svg',
    route: './reporte-volumen-ventas-cliente',
    group: 'ventas-rep',
    section: 4,
    tone: 'orange',
  }),
  item({
    label: 'Reporte general',
    description: 'Consulta el resumen general de la operación.',
    icon: '/icon-custom/Iconos/Reportes/rep-general.svg',
    route: './reporte-general',
    group: 'ventas-rep',
    section: 4,
    tone: 'orange',
  }),
  item({
    label: 'Ventas, empleados y metas',
    description: 'Compara las ventas de cada empleado contra sus metas.',
    icon: '/icon-custom/Iconos/Reportes/rep-ventasEmpleado.svg',
    route: './reporte-ventas-empleados-metas',
    iconPending: true,
    group: 'ventas-rep',
    section: 4,
    tone: 'orange',
  }),
];

export const FUNCIONALIDADES = [...CATALOGOS, ...OPERACION, ...CONFIGURACION, ...REPORTES];

export function segmentoRuta(route: string): string {
  return route.replace(/^\.\//, '').replace(/^\//, '').replace(/\/$/, '');
}

interface PerfilPermisos {
  canRead?: boolean;
  canWrite?: boolean;
  canDelete?: boolean;
  canUpdate?: boolean;
  module?: { ruta?: string | null } | null;
}

/**
 * Segmentos de ruta que el usuario puede ver en el menú.
 * 'notificaciones' solo se permite con canRead; el resto acepta cualquier permiso.
 */
export function rutasPermitidas(profiles: (PerfilPermisos | null | undefined)[]): Set<string> {
  const allowed = new Set<string>();
  for (const profile of profiles) {
    const ruta = profile?.module?.ruta;
    if (!profile || !ruta) continue;
    const segmento = segmentoRuta(ruta);
    if (segmento === 'notificaciones') {
      if (profile.canRead) allowed.add(segmento);
      continue;
    }
    if (profile.canRead || profile.canWrite || profile.canDelete || profile.canUpdate) allowed.add(segmento);
  }
  return allowed;
}

export function buscarFuncionalidad(segmento: string): Funcionalidad | undefined {
  return FUNCIONALIDADES.find((item) => segmentoRuta(item.route) === segmento);
}

export function normalizarTexto(value: string): string {
  return value.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();
}
