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
    path: '',
    pathMatch: 'full',
    redirectTo: 'principal'
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class TipoImpuestoRoutingModule { }