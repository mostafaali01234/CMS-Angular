import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth-guard';

export const routes: Routes = [
  {
    path: 'auth',
    loadChildren: () =>
      import('./feature/auth/auth.routes').then(m => m.AUTH_ROUTES),
  },
  {
    path: 'dashboard',
    canActivate: [authGuard],
    loadComponent: () => import('./feature/dashboard/dashboard').then(m => m.Dashboard)
  },
  {
    path: 'customers',
    canActivate: [authGuard],
    loadChildren: () => import('./feature/customers/customers.routes').then(m => m.CUSTOMER_ROUTES),
  },
  {
    path: 'settings',
    canActivate: [authGuard],
    loadComponent: () => import('./feature/user-account-settings/user-account-settings').then(m => m.UserAccountSettings)
  },
  { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
  { path: '**', redirectTo: 'dashboard' }
];