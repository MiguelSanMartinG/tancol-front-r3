import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ActualizarOrdenCompraComponent } from './actualizar-orden-compra/actualizar-solicitud-compra.component';

const routes: Routes = [
  {
    path: 'principal',
    loadComponent: () => import('./principal/principal.component').then( comp => comp.PrincipalComponent)
  },
  {
    path: 'actualizar-orden-compra/:id',
   component: ActualizarOrdenCompraComponent
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
export class OrdenCompraRoutingModule { }
