
import { Routes } from '@angular/router';
import { adminGuard } from '../../shared/guards/admin.guard';
export const PAYROLL_ROUTES: Routes = [
  { path: '', canActivate: [adminGuard], loadComponent: () => import('./payroll-list/payroll-list').then(m => m.PayrollList) },
  { path: 'review', loadComponent: () => import('./payroll-review/payroll-review').then(m => m.PayrollReview) },
  { path: ':id/withdraw', canActivate: [adminGuard], loadComponent: () => import('./payroll-withdraw/payroll-withdraw').then(m => m.PayrollWithdraw) },
];