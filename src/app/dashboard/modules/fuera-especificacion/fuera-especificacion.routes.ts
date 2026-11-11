import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  {
    path: 'principal',
    loadComponent: () => import('./principal/principal.component').then(c => c.PrincipalFueraEspecificacionComponent)
  },
  {
    path: 'crear',
    loadComponent: () => import('./registrar/registrar.component').then(c => c.RegistrarFueraEspecificacionComponent)
  },
  {
    path: 'actualizar/:id',
    loadComponent: () => import('./editar/editar.component').then(c => c.EditarFueraEspecificacionComponent)
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
export class FueraEspecificacionRoutingModule { }
