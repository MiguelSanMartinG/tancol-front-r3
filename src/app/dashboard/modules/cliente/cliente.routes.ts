import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  {
    path: 'principal',
    loadComponent: () => import('./principal/principal.component').then( comp => comp.PrincipalComponent)
  },
  {
    path:'crear',
    loadComponent: () => import('./registrar/registrar.component').then(comp => comp.RegistrarComponent)
  },
  {
    path:'actualizar/:id',
    loadComponent: () => import('./editar/editar.component').then(comp => comp.EditarComponent)
  },
  {
    path:'producto/:id',
    loadComponent: () => import('./producto/producto.component').then(comp => comp.ProductoComponent)
  },
  {
    path:'equipos/:id',
    loadComponent: () => import('./equipos/equipos.component').then(comp => comp.EquiposComponent)
  },
  {
    path:'precios',
    loadComponent: () => import('./precios/precios.component').then(comp => comp.PreciosComponent)
  },
  {
    path:'detalle/:id',
    loadComponent: () => import('./detalle/detalle.component').then(comp => comp.DetalleComponent)
  },
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'principal'
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ClienteRoutingModule { }
