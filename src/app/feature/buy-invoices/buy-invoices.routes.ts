// buy-invoices.routes.ts
import { Routes } from '@angular/router';

export const BUY_INVOICE_ROUTES: Routes = [
  { path: '', loadComponent: () => import('./buy-invoice-list/buy-invoice-list').then(m => m.BuyInvoiceList) },
  { path: 'new', loadComponent: () => import('./buy-invoice-form/buy-invoice-form').then(m => m.BuyInvoiceForm) },
  { path: ':id/edit', loadComponent: () => import('./buy-invoice-form/buy-invoice-form').then(m => m.BuyInvoiceForm) },
  { path: 'returns/new', loadComponent: () => import('./buy-return-form/buy-return-form').then(m => m.BuyReturnForm) },
  { path: 'returns/:id/edit', loadComponent: () => import('./buy-return-form/buy-return-form').then(m => m.BuyReturnForm) },
];