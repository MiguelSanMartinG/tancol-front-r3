import { Component, inject, input, OnInit } from '@angular/core';
import { CardComponent } from './card/card.component';
import { AppPrimengModule } from '@shared/app-primeng/app-primeng.module';
import { RouterLink } from '@angular/router';
import { TabViewModule } from 'primeng/tabview';
import { NgIf, NgClass, NgSwitch, NgSwitchCase, NgSwitchDefault } from '@angular/common';
import { LocalStorageService } from '@shared/services/local-storage.service';
import { PermissionsService } from '@app/core/services/permissions.service';



@Component({
  selector: 'app-lista-funcionalidades',
  imports: [CardComponent, AppPrimengModule, RouterLink,TabViewModule,NgIf, NgClass, NgSwitch, NgSwitchCase],
  templateUrl: './lista-funcionalidades.component.html',
  styleUrl: './lista-funcionalidades.component.scss',
})
export class ListaFuncionalidadesComponent implements OnInit {


    tabs:TabModel[] = [
      {
      label:'Catálogos',
      icon:'pi pi-folder',
      key:1
      },
            {
      label:'Operación',
      icon:'pi pi-volume-up',
      key:2
      },
            {
      label:'Configuración',
      icon:'pi pi-cog',
      key:3
      },
            {
      label:'Reportes',
      icon:'pi pi-chart-bar',
      key:4
      }

    ]

    activeTab: number = 1;
    currentPage = 0;
    readonly pageSize = 12;
    localStorageService = inject(LocalStorageService)
    permissionsService = inject(PermissionsService)

    constructor(){
      this.activeTab = this.localStorageService.getActiveTab() ?? 1;
    }

    ngOnInit(): void {
      // 1) Pintar con lo que haya en localStorage
      this.recomputeFromStorage();
      // 2) Forzar un refresh contra API tras recargar o entrar al dashboard
      this.permissionsService.refreshOnStartup().subscribe(() => {
        this.recomputeFromStorage();
      });
    }

    private recomputeFromStorage() {
      this.applyFirstLevelPermissions();
      this.applySecondLevelPermissions();
    }

    private applyFirstLevelPermissions() {
      const allowedParents = this.localStorageService.getAllowedParents();
      if (!allowedParents || allowedParents.length === 0) return;

      const parentByKey = new Map<number, string>([
        [1, 'Catálogos'],
        [2, 'Operación'],
        [3, 'Configuración'],
        [4, 'Reportes'],
      ]);

      this.tabs = this.tabs.filter((t) => {
        const parent = parentByKey.get(t.key) ?? '';
        return allowedParents.includes(parent);
      });

      if (!this.tabs.some((t) => t.key === this.activeTab)) {
        this.activeTab = this.tabs[0]?.key ?? 1;
        this.localStorageService.setActiveTab(this.activeTab);
      }
    }

    catalogosVisible: CatalogoModel[] = [];
    operacionVisible: CatalogoModel[] = [];
    configVisible: CatalogoModel[] = [];
    reportesVisible: CatalogoModel[] = [];

    private applySecondLevelPermissions() {
      const profiles = this.localStorageService.getProfiles() ?? [];
      const allowed = new Set<string>();
      profiles.forEach((p: any) => {
        if (!p) return;
        const ruta = p.module?.ruta as string | undefined;
        if (ruta?.replace(/^\.\//, '').replace(/^\//, '').replace(/\/$/, '') === 'notificaciones') {
          if (p.canRead) allowed.add('notificaciones');
          return;
        }
        const anyPerm = p.canRead || p.canWrite || p.canDelete || p.canUpdate;
        if (anyPerm && ruta) allowed.add(ruta);
      });

      const seg = (r: string) => r.replace(/^\.\//, '').replace(/^\//, '').replace(/\/$/, '');

      const normalizedAllowed = new Set([...allowed].map(seg));
      this.catalogosVisible = this.catalogos.filter((i) => normalizedAllowed.has(seg(i.route)));
      this.operacionVisible = this.operacion.filter((i) => normalizedAllowed.has(seg(i.route)));
      this.configVisible = this.config.filter((i) =>
        i.route === './configuracion-kpis' || normalizedAllowed.has(seg(i.route))
      );
      this.reportesVisible = this.reportes.filter((i) => normalizedAllowed.has(seg(i.route)));
      this.normalizePage();
    }

    get currentItems(): CatalogoModel[] {
      return this.activeTab === 1
        ? this.catalogosVisible
        : this.activeTab === 2
          ? this.operacionVisible
          : this.activeTab === 3
            ? this.configVisible
            : this.reportesVisible;
    }

    get pageItems(): CatalogoModel[] {
      const start = this.currentPage * this.pageSize;
      return this.currentItems.slice(start, start + this.pageSize);
    }

    get totalPages(): number {
      return Math.max(1, Math.ceil(this.currentItems.length / this.pageSize));
    }

    previousPage(): void {
      if (this.currentPage > 0) this.currentPage--;
    }

    nextPage(): void {
      if (this.currentPage < this.totalPages - 1) this.currentPage++;
    }

    private normalizePage(): void {
      this.currentPage = Math.min(this.currentPage, this.totalPages - 1);
    }


catalogos:CatalogoModel[] = [
    {
      label: 'Equipos',
      icon: '/icon-custom/Iconos/Catálogos/cat-equipos.svg',
      route: './equipo',
      active: true
    },
    {
      label: 'Proveedores',
      icon: '/icon-custom/Iconos/Catálogos/cat-proveedores.svg',
      route: './proveedor',
      active:true
    },
    {
      label: 'Clientes',
      icon: '/icon-custom/Iconos/Catálogos/cat-clientes.svg',
      route: './clientes',
      active:true
    },
    {
      label: 'Almacenes',
      icon: '/icon-custom/Iconos/Catálogos/cat-almacenes.svg',
      route: './almacen',
      active:true
    },
    {
      label: 'Departamentos',
      icon: '/icon-custom/Iconos/Catálogos/cat-departamentos.svg',
      route: './departamentos',
            active:true
    },
    {
      label: 'Insumos',
      icon: '/icon-custom/Iconos/Catálogos/cat-insumos.svg',
      route: './isumos',
            active:true
    },
    { //FALTA
      label: 'Productos tancol',
      icon: '/icon-custom/Iconos/Catálogos/cat-productosTancol.svg',
      route: './nuestros-productos',
            active:true
    },
    {
      label: 'Empleados',
      icon: '/icon-custom/Iconos/Catálogos/cat-empleados.svg',
      route: './empleados',
            active:true
    },
    {
      label: 'Vehículos',
      icon: '/icon-custom/Iconos/Catálogos/cat-vehiculos.svg',
      route: './vehiculos',
            active:true
    },
    {
      label: 'Rutas',
      icon: '/icon-custom/Iconos/Catálogos/cat-rutas.svg',
      route: './rutas',
            active:true
    },
    { //FALTA
      label: 'Medidores',
      icon: '/icon-custom/Iconos/Catálogos/cat-medidores.svg',
      route: './medidores',
            active:true
    },
    ]
operacion:CatalogoModel[] = [
          {
      label: 'Solicitud de compra',
      icon: '/icon-custom/Iconos/Operación/oper-solicitudCompra.svg',
      route: './solicitud-compra',
          active:true
    },
    {
      label: 'Órdenes de compra',
      icon: '/icon-custom/Iconos/Operación/oper-ordenCompra.svg',
      route: './orden-compra',
          active:true
    },
    {
      label: 'Recepción de compras',
      icon: '/icon-custom/Iconos/Operación/oper-recepcionCompra.svg',
      route: './recepcion-compra',
          active:true
    },
        {
      label: 'Inventario general',
      icon: '/icon-custom/Iconos/Operación/oper-inventarioGeneral.svg',
      route: './inventario',
          active:true
    },
    {
      label: 'Salida de material',
      icon: '/icon-custom/Iconos/Operación/oper-salidaMaterial.svg',
      route: './salida-material',
          active:true
    },
        {
      label: 'Liquidaciones',
      icon: '/icon-custom/Iconos/Operación/oper-liquidaciones.svg',
      route: './liquidacion',
          active:true
    },
    //         {
    //   label: 'Medición volumétrica',
    //   icon: 'medicion-volumetrica',
    //   route: './none',
    //       active:false
    // },
            {
      label: 'Transferencias entre almacenes',
      icon: '/icon-custom/Iconos/Operación/oper-transferenciaAlmacenes.svg',
      route: './transferencias',
          active:true
    },
    {
      label: 'Bitácora de ventas',
      icon: '/icon-custom/Iconos/Operación/oper-bitacoraVentas.svg',
      route: './bitacora-ventas',
          active:true
    },
    ]
config:CatalogoModel[] = [
    {
      label: 'Permisos avanzados',
      icon: '/icon-custom/Iconos/Configuración/cnf-permisosAvanzados.svg',
      route: './permisos-avanzados',
      active: true
    },
    {
      label: 'Tipo de proveedores',
      icon: '/icon-custom/Iconos/Configuración/cnf-tipoProveedores.svg',
      route: './tipo-proveedor',
          active:true
    },
    {
      label: 'Tipo de clientes',
      icon: '/icon-custom/Iconos/Configuración/cnf-tipoClientes.svg',
      route: './tipo-cliente',
          active:true
    },
    {
      label: 'Tipos de equipo',
      icon: '/icon-custom/Iconos/Configuración/cnf-tipoEquipos.svg',
      route: './tipo-equipo',
      active: true
    },
            {
      label: 'Fuera de especificación',
      icon: '/icon-custom/Iconos/Configuración/cnf-fueraEspecificacion.svg',
      route: './fuera-especificacion',
          active:true
    },
    {
      label: 'Categoría de insumos',
      icon: '/icon-custom/Iconos/Configuración/cnf-categoriaInsumos.svg',
      route: './categoria-producto',
      active:true
    },
    {
      label: 'Tablas de amonestación',
      icon: '/icon-custom/Iconos/Configuración/cnf-conceptosVenta.svg',
      route: './tablas-amonestaciones',
      iconPending: true,
      active: true
    },
        {
      label: 'Tipo de impuesto',
      icon: '/icon-custom/Iconos/Configuración/cnf-tipoImpuesto.svg',
      route: './tipo-impuesto',
          active:true
    },
    {
      label: 'Sistemas de almacenamiento',
      icon: '/icon-custom/Iconos/Configuración/cnf-sistemaAlmacenamiento.svg',
      route: './sistemas-almacenamiento',
      active: true,
    },
            {
      //FALTA
      label: 'Categorías productos Tancol',
      icon: '/icon-custom/Iconos/Configuración/cnf-categoriaProductosTancol.svg',
      route: './categorias-nuestros-productos',
          active:true
    },
                {
      //FALTA
      label: 'Inventario inicial',
      icon: '/icon-custom/Iconos/Configuración/cnf-inventarioInicial.svg',
      route: './inventario-inicial',
          active:true
    },
                {
      //FALTA
      label: 'Unidades de medida',
      icon: '/icon-custom/Iconos/Configuración/cnf-unidadesMedida.svg',
      route: './unidad-medida',
          active:true
    },
    {
      label: 'Tipo de empleados',
      icon: '/icon-custom/Iconos/Configuración/cnf-tipoEmpleados.svg',
      route: './tipo-empleado',
          active:true
    },
    {
      label: 'Conceptos de venta',
      icon: '/icon-custom/Iconos/Configuración/cnf-conceptosVenta.svg',
      route: './concepto-venta',
      active: true
    },

    {
      label: 'Roles de empleados',
      icon: '/icon-custom/Iconos/Configuración/cnf-rolesEmpleados.svg',
      route: './rol',
      active: true
    },
  {
      label: 'Módulos',
      icon: '/icon-custom/Iconos/Configuración/cnf-modulos.svg',
      route: './modulos',
      active: true
    },
      {
      label: 'Cuentas',
      icon: '/icon-custom/Iconos/Configuración/cnf-cuentas.svg',
      route: './cuentas',
      active: true
    },
    {
      label: 'Configurar KPIs',
      icon: '/icon-custom/Iconos/Configuración/cnf-configurarKpi.svg',
      route: './configuracion-kpis',
      active: true
    }
]
reportes:CatalogoModel[] = [
  {
    label: 'Dashboard mensual',
    icon: '/icon-custom/Iconos/Reportes/rep-general.svg',
    route: './dashboard-reportes',
    active: true
  },
  {
    label: 'Chequeo manual de cobertura',
    icon: '/icon-custom/Iconos/Reportes/rep-chequeoCobertura.svg',
    route: './chequeo-cobertura',
    active: true
  },
  {
    label: 'Notificaciones',
    icon: '/icon-custom/Iconos/Reportes/rep-notificacion.svg',
    route: './notificaciones',
    active: true
  },
  {
    label: 'Consumo de clientes',
    icon: '/icon-custom/Iconos/Reportes/rep-consumoClientes.svg',
    route: './reporte-consumo-clientes',
    active: true
  },
  {
    label: 'Salida de material',
    icon: '/icon-custom/Iconos/Reportes/rep-salidaMaterial.svg',
    route: './reporte-salida-material',
    active: true
  },
  {
    label: 'Reporte de liquidacion',
    icon: '/icon-custom/Iconos/Reportes/rep-liquidacion.svg',
    route: './reporte-liquidaciones',
    active: true
  },
  {
    label: 'Reporte de Consumo por Área y Producto',
    icon: '/icon-custom/Iconos/Reportes/rep-consumoClientes.svg',
    route: './reporte-consumo-area-producto',
    iconPending: true,
    active: true
  },
  {
    label: 'Reporte de movimientos',
    icon: '/icon-custom/Iconos/Reportes/rep-movimientos.svg',
    route: './reporte-bitacora-ventas',
    active: true
  },
  {
    label: 'Reporte de cuentas',
    icon: '/icon-custom/Iconos/Reportes/rep-cuentas.svg',
    route: './reporte-cuentas',
    active: true
  },
  {
    label: 'Ventas por empleado',
    icon: '/icon-custom/Iconos/Reportes/rep-ventasEmpleado.svg',
    route: './reporte-volumen-ventas-empleado',
    active: true
  },
  {
    label: 'Venta semanal por chofer',
    icon: '/icon-custom/Iconos/Reportes/rep-ventasEmpleado.svg',
    route: './reporte-ventas-semanal-chofer',
    iconPending: true,
    active: true
  },
  {
    label: 'Ventas por empleado por día',
    icon: '/icon-custom/Iconos/Reportes/rep-ventasEmpleadoDia.svg',
    route: './reporte-volumen-ventas-empleado-dia',
    active: true
  },
  {
    label: 'Ventas por cliente',
    icon: '/icon-custom/Iconos/Reportes/rep-ventasClientes.svg',
    route: './reporte-volumen-ventas-cliente',
    active: true
  },
  {
    label: 'Reporte general',
    icon: '/icon-custom/Iconos/Reportes/rep-general.svg',
    route: './reporte-general',
    active: true
  },
  {
    label: 'Ventas, empleados y metas',
    icon: '/icon-custom/Iconos/Reportes/rep-ventasEmpleado.svg',
    route: './reporte-ventas-empleados-metas',
    iconPending: true,
    active: true
  }
];
  listaFuncionalidades = [

  ];
  listaFiltraFuncionalidades: any[] = [];
  handleFiltroFuncionalidades({ query }: any) {
    this.listaFiltraFuncionalidades = this.listaFuncionalidades.filter(
      (row: any) =>
        (row.label as string)
          .toLocaleLowerCase()
          .includes(query.toLocaleLowerCase())
    );
  }

  tabUpdate(item:TabModel){
    this.activeTab = item.key
    this.currentPage = 0;
    this.localStorageService.setActiveTab(this.activeTab);
  }

}

export interface TabModel {
  label: string;
  icon: string;
  key: number;
}

export interface CatalogoModel{
  label: string;
  icon: string;
  route: string;
  iconPending?: boolean;
  active:boolean;
}
