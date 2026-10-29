// balances.routes.ts
import { Routes } from '@angular/router';

export const BALANCE_ROUTES: Routes = [
  { path: 'customers', data: { kind: 'customer' },
    loadComponent: () => import('./balance-list/balance-list').then(m => m.BalanceList) },
  { path: 'suppliers', data: { kind: 'supplier' },
    loadComponent: () => import('./balance-list/balance-list').then(m => m.BalanceList) },
  { path: 'customers/:id', data: { kind: 'customer' },
    loadComponent: () => import('./balance-statement/balance-statement').then(m => m.BalanceStatement) },
  { path: 'suppliers/:id', data: { kind: 'supplier' },
    loadComponent: () => import('./balance-statement/balance-statement').then(m => m.BalanceStatement) },
];