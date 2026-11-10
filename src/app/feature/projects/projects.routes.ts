// projects.routes.ts
import { Routes } from '@angular/router';

export const PROJECT_ROUTES: Routes = [
  { path: '', loadComponent: () => import('./project-list/project-list').then(m => m.ProjectList) },
  { path: 'new', loadComponent: () => import('./project-form/project-form').then(m => m.ProjectForm) },
  { path: 'review', loadComponent: () => import('./project-review-list/project-review-list').then(m => m.ProjectReviewList) },
  { path: 'review/:id', loadComponent: () => import('./project-review/project-review').then(m => m.ProjectReview) },
  { path: ':id/edit', loadComponent: () => import('./project-form/project-form').then(m => m.ProjectForm) },
];