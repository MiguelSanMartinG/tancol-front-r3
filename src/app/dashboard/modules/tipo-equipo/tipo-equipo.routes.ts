import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  {
    path: 'principal',
    loadComponent: () => import('./principal/principal.component').then(component => component.TipoEquipoPrincipalComponent),
  },
  {
    path: 'crear',
    loadComponent: () => import('./registrar/registrar.component').then(component => component.TipoEquipoRegistrarComponent),
  },
  {
    path: 'actualizar/:id',
    loadComponent: () => import('./editar/editar.component').then(component => component.TipoEquipoEditarComponent),
  },
  { path: '', pathMatch: 'full', redirectTo: 'principal' },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class TipoEquipoRoutingModule {}
