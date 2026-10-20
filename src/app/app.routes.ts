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
    path: 'orders',
    canActivate: [authGuard],
    loadChildren: () => import('./feature/orders/orders.routes').then(m => m.ORDER_ROUTES),
  },
  {
    path: 'products',
    canActivate: [authGuard],
    loadChildren: () => import('./feature/products/products.routes').then(m => m.PRODUCT_ROUTES),
  },
  {
    path: 'product-categories',
    canActivate: [authGuard],
    loadChildren: () =>
      import('./feature/product-categories/product-categories.routes').then(m => m.PRODUCT_CATEGORY_ROUTES),
  },
  {
    path: 'order-lines',
    canActivate: [authGuard],
    loadChildren: () =>
      import('./feature/order-lines/order-lines.routes').then(m => m.ORDER_LINE_ROUTES),
  },
  {
    path: 'settings',
    canActivate: [authGuard],
    loadComponent: () => import('./feature/user-account-settings/user-account-settings').then(m => m.UserAccountSettings)
  },
  { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
  { path: '**', redirectTo: 'dashboard' }
];