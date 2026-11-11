import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  {
    path: 'principal',
    loadComponent: () => import('./principal/principal.component').then(c => c.PrincipalComponent)
  },
//   {
//     path: 'crear',
//     loadComponent: () => import('./registrar/registrar.component').then(c => c.RegistrarRolComponent)
//   },
//   {
//     path: 'actualizar/:id',
//     loadComponent: () => import('./editar/editar.component').then(c => c.EditarRolComponent)
//   },
//   {
//     path: 'permisos/:id',
//     loadComponent: () => import('./permisos/permisos.component').then(c => c.PermisosRolComponent)
//   },
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
export class CuentasRoutingModule {}