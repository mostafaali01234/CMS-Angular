// money-safe-transactions.routes.ts
import { Routes } from '@angular/router';

export const MONEY_SAFE_TRANSACTION_ROUTES: Routes = [
  { path: '', loadComponent: () => import('./money-safe-transaction-list/money-safe-transaction-list').then(m => m.MoneySafeTransactionList) },
  { path: 'new', loadComponent: () => import('./money-safe-transaction-form/money-safe-transaction-form').then(m => m.MoneySafeTransactionForm) },
  { path: ':id/edit', loadComponent: () => import('./money-safe-transaction-form/money-safe-transaction-form').then(m => m.MoneySafeTransactionForm) },
];