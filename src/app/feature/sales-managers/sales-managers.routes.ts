import { Routes } from '@angular/router';
export const SALES_MANAGER_ROUTES: Routes = [
  { path: '', loadComponent: () => import('./sales-manager-list/sales-manager-list').then(m => m.SalesManagerList) },
  { path: 'new', loadComponent: () => import('./sales-manager-form/sales-manager-form').then(m => m.SalesManagerForm) },
  { path: ':id/edit', loadComponent: () => import('./sales-manager-form/sales-manager-form').then(m => m.SalesManagerForm) },
];