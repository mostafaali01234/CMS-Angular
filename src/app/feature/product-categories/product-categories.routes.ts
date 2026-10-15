// product-categories.routes.ts
import { Routes } from '@angular/router';

export const PRODUCT_CATEGORY_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./product-category-list/product-category-list').then(m => m.ProductCategoryList),
  },
  {
    path: 'new',
    loadComponent: () =>
      import('./product-category-form/product-category-form').then(m => m.ProductCategoryForm),
  },
  {
    path: ':id/edit',
    loadComponent: () =>
      import('./product-category-form/product-category-form').then(m => m.ProductCategoryForm),
  },
];