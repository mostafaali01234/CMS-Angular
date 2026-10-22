// money-safes.routes.ts
import { Routes } from '@angular/router';

export const MONEY_SAFE_ROUTES: Routes = [
  { path: '', loadComponent: () => import('./money-safe-list/money-safe-list').then(m => m.MoneySafeList) },
  { path: 'new', loadComponent: () => import('./money-safe-form/money-safe-form').then(m => m.MoneySafeForm) },
  { path: ':id/edit', loadComponent: () => import('./money-safe-form/money-safe-form').then(m => m.MoneySafeForm) },
  // { path: ':id/moves', loadComponent: () => import('./money-safe-moves/money-safe-moves').then(m => m.MoneySafeMoves) },
];