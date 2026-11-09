
import { Routes } from '@angular/router';
export const PAYROLL_ROUTES: Routes = [
  { path: '', loadComponent: () => import('./payroll-list/payroll-list').then(m => m.PayrollList) },
  { path: 'review', loadComponent: () => import('./payroll-review/payroll-review').then(m => m.PayrollReview) },
  { path: ':id/withdraw', loadComponent: () => import('./payroll-withdraw/payroll-withdraw').then(m => m.PayrollWithdraw) },
];