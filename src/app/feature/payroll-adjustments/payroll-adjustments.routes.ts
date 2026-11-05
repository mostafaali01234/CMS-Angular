// payroll-adjustments.routes.ts
import { Routes } from '@angular/router';

export const ADJUSTMENT_ROUTES: Routes = [
  { path: '', loadComponent: () => import('./payroll-adjustment-list/payroll-adjustment-list').then(m => m.PayrollAdjustmentList) },
  { path: 'new', loadComponent: () => import('./payroll-adjustment-form/payroll-adjustment-form').then(m => m.PayrollAdjustmentForm) },
  { path: ':id/edit', loadComponent: () => import('./payroll-adjustment-form/payroll-adjustment-form').then(m => m.PayrollAdjustmentForm) },
];