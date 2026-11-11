import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  {
    path: 'principal',
    loadComponent: () => import('./principal/principal.component').then(m => m.PrincipalComponent)
  },
  {
    path: 'crear',
    loadComponent: () => import('./registrar/registrar.component').then(m => m.RegistrarComponent)
  },
  {
    path: 'actualizar/:id',
    loadComponent: () => import('./editar/editar.component').then(m => m.EditarComponent)
  },
  {
    path: 'bitacora/:id',
    loadComponent: () => import('./bitacora/bitacora.component').then(m => m.BitacoraComponent)
  },
  {
    path: 'hijos/:id',
    loadComponent: () => import('./hijos/hijos.component').then(m => m.HijosComponent)
  },
  {
    path: 'hijos/:id/crear',
    loadComponent: () => import('./registrar-hijo/registrar-hijo.component').then(m => m.RegistrarHijoComponent)
  },
  {
    path: 'arbol',
    loadComponent: () => import('./arbol/arbol.component').then(m => m.ArbolComponent)
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
export class MedidoresRoutingModule {}
