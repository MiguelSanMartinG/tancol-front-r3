import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  {
    path: 'principal',
    loadComponent: () => import('./principal/principal.component').then((c) => c.PrincipalComponent),
  },
  {
    path: 'crear',
    loadComponent: () => import('./registrar/registrar.component').then((c) => c.RegistrarComponent),
  },
  {
    path: 'actualizar/:id',
    loadComponent: () => import('./actualizar/actualizar.component').then((c) => c.ActualizarComponent),
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
export class LiquidacionRoutingModule {}
