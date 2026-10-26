// customer-payments.routes.ts
import { Routes } from '@angular/router';

export const CUSTOMER_PAYMENT_ROUTES: Routes = [
  { path: '', loadComponent: () => import('./customer-payment-list/customer-payment-list').then(m => m.CustomerPaymentList) },
  { path: 'new', loadComponent: () => import('./customer-payment-form/customer-payment-form').then(m => m.CustomerPaymentForm) },
];