// expenses.routes.ts
import { Routes } from '@angular/router';

export const EXPENSE_ROUTES: Routes = [
  { path: '', loadComponent: () => import('./expense-list/expense-list').then(m => m.ExpenseList) },
  { path: 'new', loadComponent: () => import('./expense-form/expense-form').then(m => m.ExpenseForm) },
  { path: ':id/edit', loadComponent: () => import('./expense-form/expense-form').then(m => m.ExpenseForm) },
];