// reports.routes.ts
import { Routes } from '@angular/router';

const matrix = () => import('./category-matrix-report/category-matrix-report').then(m => m.CategoryMatrixReport);

export const REPORT_ROUTES: Routes = [
  { path: 'unfinished-orders', loadComponent: () => import('./unfinished-orders-report/unfinished-orders-report').then(m => m.UnfinishedOrdersReport) },
  { path: 'advance-orders', loadComponent: () => import('./advance-orders-report/advance-orders-report').then(m => m.AdvanceOrdersReport) },
  { path: 'unpaid-invoices', loadComponent: () => import('./unpaid-invoices-report/unpaid-invoices-report').then(m => m.UnpaidInvoicesReport) },
  { path: 'monthly-sales', loadComponent: () => import('./monthly-sales-report/monthly-sales-report').then(m => m.MonthlySalesReport) },

  // one screen for the six "rows x product category" reports; the route data picks the report
  { path: 'orders-by-state', loadComponent: matrix, data: { source: 'orders', rowBy: 'state' } },
  { path: 'invoices-by-state', loadComponent: matrix, data: { source: 'invoices', rowBy: 'state' } },
  { path: 'orders-by-seller', loadComponent: matrix, data: { source: 'orders', rowBy: 'seller' } },
  { path: 'invoices-by-seller', loadComponent: matrix, data: { source: 'invoices', rowBy: 'seller' } },
  { path: 'orders-by-tech', loadComponent: matrix, data: { source: 'orders', rowBy: 'tech' } },
  { path: 'invoices-by-tech', loadComponent: matrix, data: { source: 'invoices', rowBy: 'tech' } },

  { path: 'maintenance', loadComponent: () => import('./maintenance-report/maintenance-report').then(m => m.MaintenanceReportPage) },
  { path: '', pathMatch: 'full', redirectTo: 'unfinished-orders' },
];
