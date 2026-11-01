// stock.routes.ts
import { Routes } from '@angular/router';

export const STOCK_ROUTES: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'matrix' },
  { path: 'matrix', loadComponent: () => import('./stock-matrix/stock-matrix').then(m => m.StockMatrix) },
  { path: 'store', loadComponent: () => import('./store-stock/store-stock').then(m => m.StoreStock) },
  { path: 'store-moves', loadComponent: () => import('./store-moves/store-moves').then(m => m.StoreMoves) },
  { path: 'product-moves', loadComponent: () => import('./product-moves/product-moves').then(m => m.ProductMoves) },
];