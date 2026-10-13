// customers.routes.ts
import { Routes } from '@angular/router';

export const CUSTOMER_ROUTES: Routes = [
  { path: '', loadComponent: () => import('./customer-list/customer-list').then(m => m.CustomerList) },
  { path: 'new', loadComponent: () => import('./customer-form/customer-form').then(m => m.CustomerForm) },
  { path: ':id/edit', loadComponent: () => import('./customer-form/customer-form').then(m => m.CustomerForm) },
];