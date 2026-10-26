// supplier-payments.routes.ts
import { Routes } from '@angular/router';

export const SUPPLIER_PAYMENT_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./supplier-payment-list/supplier-payment-list').then(m => m.SupplierPaymentList),
  },
  {
    path: 'new',
    loadComponent: () =>
      import('./supplier-payment-form/supplier-payment-form').then(m => m.SupplierPaymentForm),
  },
];