// expense-categories.routes.ts
import { Routes } from '@angular/router';

export const EXPENSE_CATEGORY_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./expense-category-list/expense-category-list').then(m => m.ExpenseCategoryList),
  },
  {
    path: 'new',
    loadComponent: () =>
      import('./expense-category-form/expense-category-form').then(m => m.ExpenseCategoryForm),
  },
  {
    path: ':id/edit',
    loadComponent: () =>
      import('./expense-category-form/expense-category-form').then(m => m.ExpenseCategoryForm),
  },
];