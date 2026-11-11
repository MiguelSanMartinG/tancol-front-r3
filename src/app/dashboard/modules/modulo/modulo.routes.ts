import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  {
    path: 'principal',
    loadComponent: () => import('./principal/principal.component').then(c => c.PrincipalModuloComponent)
  },
  {
    path: 'crear',
    loadComponent: () => import('./registrar/registrar.component').then(c => c.RegistrarModuloComponent)
  },
  {
    path: 'actualizar/:id',
    loadComponent: () => import('./editar/editar.component').then(c => c.EditarModuloComponent)
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
export class ModuloRoutingModule {}
