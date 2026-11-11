import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { permissionGuard } from '@app/core/guards/auth.guard';

const routes: Routes = [
  {
    path: 'principal',
    loadComponent: () =>
      import('./principal/principal.component').then(
        (comp) => comp.PrincipalComponent
      ),
    canActivateChild: [permissionGuard],
    children: [
      {
        path: 'departamentos',
        loadChildren: () =>
          import('./modules/departamento/departamento.routes').then(
            (mod) => mod.DepartamentoRoutingModule
          ),
      },
      {
        path: 'almacen',
        loadChildren: () =>
          import('./modules/almacen/almacen.routes').then(
            (mod) => mod.AlmacenRoutingModule
          ),
      },
      {
        path: 'categoria-producto',
        loadChildren: () =>
          import('./modules/categoria-producto/categoria-producto.routes').then(
            (mod) => mod.CategoriaProductoRoutingModule
          ),
      },
      {
        path: 'orden-compra',
        loadChildren: () =>
          import('./modules/orden-compra/ordencompra.routes').then(
            (mod) => mod.OrdenCompraRoutingModule
          ),
      },
      {
        path: 'isumos',
        loadChildren: () =>
          import('./modules/producto/producto.routes').then(
            (mod) => mod.ProductoRoutingModule
          ),
      },
      {
        path: 'proveedor',
        loadChildren: () =>
          import('./modules/proveedor/proveedor.routes').then(
            (mod) => mod.ProveedorRoutingModule
          ),
      },
      {
        path: 'recepcion-compra',
        loadChildren: () =>
          import('./modules/recepcion-compra/recepcion-compra.routes').then(
            (mod) => mod.RecepcionCompraRoutingModule
          ),
      },
      {
        path: 'salida-material',
        loadChildren: () =>
          import('./modules/salida-material/salida-material.routes').then(
            (mod) => mod.DepartamentoRoutingModule
          ),
      },
      {
        path: 'solicitud-compra',
        loadChildren: () =>
          import('./modules/solicitud-compra/solicitud-compra.routes').then(
            (mod) => mod.SolicitudCompraRoutingModule
          ),
      },
      {
        path: 'tipo-impuesto',
        loadChildren: () =>
          import('./modules/tipo-impuesto/tipo-impuesto.routes').then(
            (mod) => mod.TipoImpuestoRoutingModule
          ),
      },
      {
        path: 'tipo-proveedor',
        loadChildren: () =>
          import('./modules/tipo-proveedor/tipo-proveedor.routes').then(
            (mod) => mod.TipoImpuestoRoutingModule
          ),
      },
      {
        path: 'sistemas-almacenamiento',
        loadChildren: () =>
          import('./modules/sistema-almacenamiento/sistema-almacenamiento.routes').then(
            (mod) => mod.SistemaAlmacenamientoRoutingModule
          ),
      },
      {
        path: 'inventario',
        loadChildren: () =>
          import('./modules/inventario/inventario.routes').then(
            (mod) => mod.InventarioRoutingModule
          ),
      },
      {
        path: 'tipo-empleado',
        loadChildren: () =>
          import('./modules/tipo-empleado/tipo-empleado.routes').then(
            (mod) => mod.TipoEmpleadoRoutingModule
          ),
      },
      {
        path: 'tipo-cliente',
        loadChildren: () =>
          import('./modules/tipo-cliente/tipo-cliente.routes').then(
            (mod) => mod.TipoClienteRoutingModule
          ),
      },
      {
        path: 'tipo-equipo',
        loadChildren: () =>
          import('./modules/tipo-equipo/tipo-equipo.routes').then(
            (mod) => mod.TipoEquipoRoutingModule
          ),
      },
      {
        path: 'equipo',
        loadChildren: () =>
          import('./modules/equipo/equipo.routes').then(
            (mod) => mod.EquipoRoutingModule
          ),
      },
      {
        path: 'rol',
        loadChildren: () =>
          import('./modules/rol/rol.routes').then(
            (mod) => mod.RolRoutingModule
          ),
      },
      {
        path: 'modulos',
        loadChildren: () =>
          import('./modules/modulo/modulo.routes').then(
            (mod) => mod.ModuloRoutingModule
          ),
      },
      {
        path: 'cuentas',
        loadChildren: () =>
          import('./modules/cuentas/cuentas.routes').then(
            (mod) => mod.CuentasRoutingModule
          ),

      },
      {
        path: 'fuera-especificacion',
        loadChildren: () =>
          import('./modules/fuera-especificacion/fuera-especificacion.routes').then(
            (mod) => mod.FueraEspecificacionRoutingModule
          ),
      },
      {
        path: 'concepto-venta',
        loadChildren: () =>
          import('./modules/concepto-venta/concepto-venta.routes').then(
            (mod) => mod.ConceptoVentaRoutingModule
          ),
      },
      {
        path: 'unidad-medida',
        loadChildren: () =>
          import('./modules/unidades-medida/unidad-medida.routes').then(
            (mod) => mod.UnidadMedidaRoutingModule
          ),
      },
      {
        path: 'empleados',
        loadChildren: () =>
          import('./modules/empleados/empleado.routes').then(
            (mod) => mod.EmpleadoRoutingModule
          ),
      },
      {
        path: 'clientes',
        loadChildren: () =>
          import('./modules/cliente/cliente.routes').then(
            (mod) => mod.ClienteRoutingModule
          ),
      },
      {
        path: 'vehiculos',
        loadChildren: () =>
          import('./modules/vehiculos/vehiculos.routes').then(
            (mod) => mod.VehiculosRoutingModule
          ),
      },
      {
        path: 'rutas',
        loadChildren: () =>
          import('./modules/rutas/rutas.routes').then(
            (mod) => mod.RutasRoutingModule
          ),
      },
      {
        path: 'medidores',
        loadChildren: () =>
          import('./modules/medidores/medidores.routes').then(
            (mod) => mod.MedidoresRoutingModule
          ),
      },
                  {
        path: 'inventario-inicial',
        loadChildren: () =>
          import('./modules/inventario-inicial/inventario-inicial.routes').then(
            (mod) => mod.InventarioInicialRoutingModule
          ),
      },
      {
        path:'categorias-nuestros-productos',
        loadChildren:() => import('./modules/categoria-nuestros-productos/categoria-nuestros-productos.routes').then(
          (mod)=>mod.CategoriaProductoRoutingModule
        )
      },
            {
        path:'nuestros-productos',
        loadChildren:() => import('./modules/nuestros-productos/nuestros-productos.routes').then(
          (mod)=>mod.NuestrosProductoRoutingModule
        )
      },
      {
        path:'transferencias',
        loadChildren:() => import('./modules/transferencias/transferencias.routes').then(
          (mod)=>mod.TransferenciasRoutingModule
        )
      },
      {
        path:'bitacora-ventas',
        loadChildren:() => import('./modules/venta-ruta/venta-ruta.routes').then(
          (mod)=>mod.VentaRutaRoutingModule
        )
      },
      {
        path:'liquidacion',
        loadChildren:() => import('./modules/liquidacion/liquidacion.routes').then(
          (mod)=>mod.LiquidacionRoutingModule
        )
      },
      {
        path:'chequeo-cobertura',
        loadChildren:() => import('./modules/chequeo-cobertura/chequeo-cobertura.routes').then(
          (mod)=>mod.ChequeoCoberturaRoutingModule
        )
      },
      {
        path: 'permisos-avanzados',
        loadChildren: () =>
          import('./modules/permisos-avanzados/permisos-avanzados.routes').then(
            (mod) => mod.PermisosAvanzadosRoutingModule
          ),
      },
      {
        path:'notificaciones',
        loadChildren:() => import('./modules/notificaciones/notificaciones.routes').then(
          (mod)=>mod.NotificacionesRoutingModule
        )
      },
      {
        path:'dashboard-reportes',
        loadChildren:() => import('./modules/dashboard-reportes/dashboard-reportes.routes').then(
          (mod)=>mod.DashboardReportesRoutingModule
        )
      },
      {
        path: 'metas-ventas',
        loadChildren: () => import('./modules/metas-ventas/metas-ventas.routes').then(
          (mod) => mod.MetasVentasRoutingModule
        )
      },
      {
        path: 'tablas-amonestaciones',
        loadChildren: () => import('./modules/tablas-amonestaciones/tablas-amonestaciones.routes').then((mod) => mod.TablasAmonestacionesRoutingModule)
      },
      {
        path: 'configuracion-kpis',
        loadChildren: () =>
          import('./modules/configuracion-kpis/configuracion-kpis.routes').then(
            (mod) => mod.ConfiguracionKpisRoutingModule
          ),
      },
      {
        path:'reporte-consumo-clientes',
        loadChildren:() => import('./modules/reporte-consumo-clientes/reporte-consumo-clientes.routes').then(
          (mod)=>mod.ReporteConsumoClientesRoutingModule
        )
      },
      {
        path:'reporte-salida-material',
        loadChildren:() => import('./modules/reporte-salida-material/reporte-salida-material.routes').then(
          (mod)=>mod.ReporteSalidaMaterialRoutingModule
        )
      },
      {
        path:'reporte-liquidaciones',
        loadChildren:() => import('./modules/reporte-liquidaciones/reporte-liquidaciones.routes').then(
          (mod)=>mod.ReporteLiquidacionesRoutingModule
        )
      },
      {
        path:'reporte-bitacora-ventas',
        loadChildren:() => import('./modules/reporte-bitacora-ventas/reporte-bitacora-ventas.routes').then(
          (mod)=>mod.ReporteBitacoraVentasRoutingModule
        )
      },
      {
        path: 'reporte-consumo-area-producto',
        loadChildren: () => import('./modules/reporte-consumo-area-producto/reporte-consumo-area-producto.routes').then((mod) => mod.ReporteConsumoAreaProductoRoutingModule)
      },
      {
        path:'reporte-cuentas',
        loadChildren:() => import('./modules/reporte-cuentas/reporte-cuentas.routes').then(
          (mod)=>mod.ReporteCuentasRoutingModule
        )
      },
      {
        path:'reporte-volumen-ventas-empleado',
        loadChildren:() => import('./modules/reporte-volumen-ventas-empleado/reporte-volumen-ventas-empleado.routes').then(
          (mod)=>mod.ReporteVolumenVentasEmpleadoRoutingModule
        )
      },
      {
        path:'reporte-ventas-semanal-chofer',
        loadChildren:() => import('./modules/reporte-ventas-semanal-chofer/reporte-ventas-semanal-chofer.routes').then(
          (mod)=>mod.ReporteVentasSemanalChoferRoutingModule
        )
      },
      {
        path:'reporte-volumen-ventas-empleado-dia',
        loadChildren:() => import('./modules/reporte-volumen-ventas-empleado-dia/reporte-volumen-ventas-empleado-dia.routes').then(
          (mod)=>mod.ReporteVolumenVentasEmpleadoDiaRoutingModule
        )
      },
      {
        path:'reporte-volumen-ventas-cliente',
        loadChildren:() => import('./modules/reporte-volumen-ventas-cliente/reporte-volumen-ventas-cliente.routes').then(
          (mod)=>mod.ReporteVolumenVentasClienteRoutingModule
        )
      },
      {
        path: 'reporte-ventas-empleados-metas',
        loadChildren: () => import('./modules/reporte-ventas-empleados-metas/reporte-ventas-empleados-metas.routes').then(
          (mod) => mod.ReporteVentasEmpleadosMetasRoutingModule
        )
      },
      {
        path:'reporte-general',
        loadChildren:() => import('./modules/reporte-general/reporte-general.routes').then(
          (mod)=>mod.ReporteGeneralRoutingModule
        )
      },
      {
        path: '',
        pathMatch: 'full',
        loadComponent: () =>
          import('./lista-funcionalidades/lista-funcionalidades.component').then(
            (comp) => comp.ListaFuncionalidadesComponent
          )
      }
    ],
  },
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'principal',
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class DashboardRoutingModule {}
