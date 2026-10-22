// money-safe-categories.routes.ts
import { Routes } from '@angular/router';

export const MONEY_SAFE_CATEGORY_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./money-safe-category-list/money-safe-category-list').then(m => m.MoneySafeCategoryList),
  },
  {
    path: 'new',
    loadComponent: () =>
      import('./money-safe-category-form/money-safe-category-form').then(m => m.MoneySafeCategoryForm),
  },
  {
    path: ':id/edit',
    loadComponent: () =>
      import('./money-safe-category-form/money-safe-category-form').then(m => m.MoneySafeCategoryForm),
  },
];