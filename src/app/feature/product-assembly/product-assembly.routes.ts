// product-assembly.routes.ts
import { Routes } from '@angular/router';

export const PRODUCT_ASSEMBLY_ROUTES: Routes = [
  // operations
  { path: '', loadComponent: () => import('./operation-list/operation-list').then(m => m.OperationList) },
  { path: 'new', loadComponent: () => import('./operation-form/operation-form').then(m => m.OperationForm) },
  { path: ':id/edit', loadComponent: () => import('./operation-form/operation-form').then(m => m.OperationForm) },

  // definitions (the recipe of each assembled product)
  { path: 'definitions', loadComponent: () => import('./definition-list/definition-list').then(m => m.DefinitionList) },
  { path: 'definitions/new', loadComponent: () => import('./definition-form/definition-form').then(m => m.DefinitionForm) },
  { path: 'definitions/:productId/edit', loadComponent: () => import('./definition-form/definition-form').then(m => m.DefinitionForm) },
];
