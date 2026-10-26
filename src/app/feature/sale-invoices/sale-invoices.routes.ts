// sale-invoices.routes.ts
import { Routes } from '@angular/router';

export const SALE_INVOICE_ROUTES: Routes = [
  { path: '', loadComponent: () => import('./sale-invoice-list/sale-invoice-list').then(m => m.SaleInvoiceList) },
  { path: 'new', loadComponent: () => import('./sale-invoice-form/sale-invoice-form').then(m => m.SaleInvoiceForm) },
  { path: 'returns/new', loadComponent: () => import('./sale-return-form/sale-return-form').then(m => m.SaleReturnForm) },
  { path: 'returns/:id/edit', loadComponent: () => import('./sale-return-form/sale-return-form').then(m => m.SaleReturnForm) },
  { path: ':id/edit', loadComponent: () => import('./sale-invoice-form/sale-invoice-form').then(m => m.SaleInvoiceForm) },
];