// orders.routes.ts
import { Routes } from '@angular/router';

export const ORDER_ROUTES: Routes = [
  { path: '', loadComponent: () => import('./order-list/order-list').then(m => m.OrderList) },
  { path: 'new', loadComponent: () => import('./order-form/order-form').then(m => m.OrderForm) },
  { path: 'maintenance', loadComponent: () => import('./order-maintenance/order-maintenance').then(m => m.OrderMaintenance) },
  { path: ':id/edit', loadComponent: () => import('./order-form/order-form').then(m => m.OrderForm) },
];