// cars.routes.ts
import { Routes } from '@angular/router';

export const CAR_ROUTES: Routes = [
  { path: '', loadComponent: () => import('./car-list/car-list').then(m => m.CarList) },
  { path: 'new', loadComponent: () => import('./car-form/car-form').then(m => m.CarForm) },
  { path: ':id/edit', loadComponent: () => import('./car-form/car-form').then(m => m.CarForm) },
];