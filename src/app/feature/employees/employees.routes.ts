// employees.routes.ts
import { Routes } from '@angular/router';

export const EMPLOYEE_ROUTES: Routes = [
  { path: '', loadComponent: () => import('./employee-list/employee-list').then(m => m.EmployeeList) },
  { path: 'new', loadComponent: () => import('./employee-form/employee-form').then(m => m.EmployeeForm) },
  { path: ':id/edit', loadComponent: () => import('./employee-form/employee-form').then(m => m.EmployeeForm) },
  // add later: ':id/balance'
];