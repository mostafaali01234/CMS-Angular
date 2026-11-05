// employee-loans.routes.ts
import { Routes } from '@angular/router';

export const EMPLOYEE_LOAN_ROUTES: Routes = [
  { path: '', loadComponent: () => import('./employee-loan-list/employee-loan-list').then(m => m.EmployeeLoanList) },
  { path: 'new', loadComponent: () => import('./employee-loan-form/employee-loan-form').then(m => m.EmployeeLoanForm) },
  { path: ':id/edit', loadComponent: () => import('./employee-loan-form/employee-loan-form').then(m => m.EmployeeLoanForm) },
];