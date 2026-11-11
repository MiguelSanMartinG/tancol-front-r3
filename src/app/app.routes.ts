import { Routes } from '@angular/router';
import { LoginComponent } from './auth/login/login.component';
import { PrincipalComponent } from './dashboard/principal/principal.component';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
    {
        path: 'dashboard',
        canMatch: [authGuard],
        loadChildren: ()=> import('./dashboard/dashboard.routes').then( mod => mod.DashboardRoutingModule),
    },
    {
        path: 'login',
        component: LoginComponent
    },
    {
        path: '',
        pathMatch: 'full',
        redirectTo: '/login'
    }
];
