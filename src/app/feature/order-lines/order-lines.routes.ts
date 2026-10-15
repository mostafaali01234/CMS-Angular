// order-lines.routes.ts
import { Routes } from '@angular/router';

export const ORDER_LINE_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./order-line-list/order-line-list').then(m => m.OrderLineList),
  },
  {
    path: 'new',
    loadComponent: () =>
      import('./order-line-form/order-line-form').then(m => m.OrderLineForm),
  },
  {
    path: ':id/edit',
    loadComponent: () =>
      import('./order-line-form/order-line-form').then(m => m.OrderLineForm),
  },
];