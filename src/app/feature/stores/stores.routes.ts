// stores.routes.ts
import { Routes } from '@angular/router';

export const STORE_ROUTES: Routes = [
  { path: '', loadComponent: () => import('./store-list/store-list').then(m => m.StoreList) },
  { path: 'new', loadComponent: () => import('./store-form/store-form').then(m => m.StoreForm) },
  { path: ':id/edit', loadComponent: () => import('./store-form/store-form').then(m => m.StoreForm) },
];