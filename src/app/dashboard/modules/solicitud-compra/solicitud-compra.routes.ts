import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  {
    path: 'principal',
    loadComponent: () => import('./principal/principal.component').then( comp => comp.PrincipalComponent)
  },
  {
    path: 'registrar-solicitud-compra',
    loadComponent: () => import('./registrar-solictud-compra/registrar-solicitud-compra.component').then( comp => comp.RegistrarSolicitudCompraComponent)
  },
  {
    path: 'actualizar-solicitud-compra/:id',
    loadComponent: () => import('./actualizar-solictud-compra/actualizar-solicitud-compra.component').then( comp => comp.ActualizarSolicitudCompraComponent)
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
export class SolicitudCompraRoutingModule { }
