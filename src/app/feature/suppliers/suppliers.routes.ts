// suppliers.routes.ts
import { Routes } from '@angular/router';

export const SUPPLIER_ROUTES: Routes = [
  { path: '', loadComponent: () => import('./supplier-list/supplier-list').then(m => m.SupplierList) },
  { path: 'new', loadComponent: () => import('./supplier-form/supplier-form').then(m => m.SupplierForm) },
  { path: ':id/edit', loadComponent: () => import('./supplier-form/supplier-form').then(m => m.SupplierForm) },
];