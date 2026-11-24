import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  {
    path: 'principal',
    loadComponent: () => import('./principal/principal.component').then((c) => c.InventarioDiarioPrincipalComponent),
  },
  { path: '', pathMatch: 'full', redirectTo: 'principal' },
];

@NgModule({ imports: [RouterModule.forChild(routes)], exports: [RouterModule] })
export class InventarioDiarioRoutingModule {}
