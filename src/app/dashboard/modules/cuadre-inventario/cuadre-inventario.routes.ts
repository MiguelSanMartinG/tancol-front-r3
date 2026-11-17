import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    loadComponent: () =>
      import('./principal/principal.component').then((comp) => comp.PrincipalComponent),
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./detalle/detalle.component').then((comp) => comp.DetalleComponent),
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class CuadreInventarioRoutingModule {}
