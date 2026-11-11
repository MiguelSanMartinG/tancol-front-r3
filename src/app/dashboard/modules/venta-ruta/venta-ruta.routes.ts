import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  {
    path: 'principal',
    loadComponent: () => import('./principal/principal.component').then(comp => comp.PrincipalComponent)
  },
  {
    path: 'crear',
    loadComponent: () => import('./crear/crear.component').then(comp => comp.CrearComponent)
  },
  {
    path: 'actualizar/:id',
    loadComponent: () => import('./actualizar/actualizar.component').then(comp => comp.ActualizarComponent)
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
export class VentaRutaRoutingModule {}
