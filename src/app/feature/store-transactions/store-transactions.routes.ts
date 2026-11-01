// store-transactions.routes.ts
import { Routes } from '@angular/router';

export const STORE_TRANSACTION_ROUTES: Routes = [
  { path: '', loadComponent: () => import('./store-transaction-list/store-transaction-list').then(m => m.StoreTransactionList) },
  { path: 'new', loadComponent: () => import('./store-transaction-form/store-transaction-form').then(m => m.StoreTransactionForm) },
  { path: ':id/edit', loadComponent: () => import('./store-transaction-form/store-transaction-form').then(m => m.StoreTransactionForm) },
];