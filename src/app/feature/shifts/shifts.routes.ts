import { Routes } from '@angular/router';
export const SHIFT_ROUTES: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'day' },
  { path: 'day', loadComponent: () => import('./shift-day/shift-day').then(m => m.ShiftDay) },
  { path: 'board', loadComponent: () => import('./shift-board/shift-board').then(m => m.ShiftBoardPage) },
];