import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth-guard';

export const routes: Routes = [
  {
    path: 'auth',
    loadChildren: () =>
      import('./feature/auth/auth.routes').then(m => m.AUTH_ROUTES),
  },
  {
    path: 'dashboard',
    canActivate: [authGuard],
    loadComponent: () => import('./feature/dashboard/dashboard').then(m => m.Dashboard)
  },
  {
    path: 'customers',
    canActivate: [authGuard],
    loadChildren: () => import('./feature/customers/customers.routes').then(m => m.CUSTOMER_ROUTES),
  },
  {
    path: 'orders',
    canActivate: [authGuard],
    loadChildren: () => import('./feature/orders/orders.routes').then(m => m.ORDER_ROUTES),
  },
  {
    path: 'products',
    canActivate: [authGuard],
    loadChildren: () => import('./feature/products/products.routes').then(m => m.PRODUCT_ROUTES),
  },
  {
    path: 'product-categories',
    canActivate: [authGuard],
    loadChildren: () =>
      import('./feature/product-categories/product-categories.routes').then(m => m.PRODUCT_CATEGORY_ROUTES),
  },
  {
    path: 'order-lines',
    canActivate: [authGuard],
    loadChildren: () =>
      import('./feature/order-lines/order-lines.routes').then(m => m.ORDER_LINE_ROUTES),
  },
  {
    path: 'settings',
    canActivate: [authGuard],
    loadComponent: () => import('./feature/user-account-settings/user-account-settings').then(m => m.UserAccountSettings)
  },
  {
    path: 'money-safe-categories',
    canActivate: [authGuard],
    loadChildren: () =>
      import('./feature/money-safe-categories/money-safe-categories.routes').then(m => m.MONEY_SAFE_CATEGORY_ROUTES),
  },
  {
    path: 'money-safes',
    canActivate: [authGuard],
    loadChildren: () => import('./feature/money-safes/money-safes.routes').then(m => m.MONEY_SAFE_ROUTES),
  },
  {
    path: 'stores',
    canActivate: [authGuard],
    loadChildren: () => import('./feature/stores/stores.routes').then(m => m.STORE_ROUTES),
  },
  {
    path: 'buy-invoices',
    canActivate: [authGuard],
    loadChildren: () => import('./feature/buy-invoices/buy-invoices.routes').then(m => m.BUY_INVOICE_ROUTES),
  },
  {
    path: 'supplier-payments',
    canActivate: [authGuard],
    loadChildren: () => import('./feature/supplier-payments/supplier-payments.routes').then(m => m.SUPPLIER_PAYMENT_ROUTES),
  },
  {
    path: 'suppliers',
    canActivate: [authGuard],
    loadChildren: () => import('./feature/suppliers/suppliers.routes').then(m => m.SUPPLIER_ROUTES),
  },
  { path: 'sale-invoices', canActivate: [authGuard],
    loadChildren: () => import('./feature/sale-invoices/sale-invoices.routes').then(m => m.SALE_INVOICE_ROUTES) },
  { path: 'customer-payments', canActivate: [authGuard],
    loadChildren: () => import('./feature/customer-payments/customer-payments.routes').then(m => m.CUSTOMER_PAYMENT_ROUTES) },
  { path: 'balances', canActivate: [authGuard],
    loadChildren: () => import('./feature/balances/balances.routes').then(m => m.BALANCE_ROUTES) },
  {
    path: 'expense-categories',
    canActivate: [authGuard],
    loadChildren: () =>
      import('./feature/expense-categories/expense-categories.routes').then(m => m.EXPENSE_CATEGORY_ROUTES),
  },
  {
    path: 'expense-types',
    canActivate: [authGuard],
    loadChildren: () =>
      import('./feature/expense-types/expense-types.routes').then(m => m.EXPENSE_TYPE_ROUTES),
  },
  { 
    path: 'expenses', canActivate: [authGuard],
    loadChildren: () => import('./feature/expenses/expenses.routes').then(m => m.EXPENSE_ROUTES) 
  },
  { 
    path: 'cars', canActivate: [authGuard],
    loadChildren: () => import('./feature/cars/cars.routes').then(m => m.CAR_ROUTES) 
  },
  { 
    path: 'money-safe-transactions', canActivate: [authGuard],
    loadChildren: () => import('./feature/money-safe-transactions/money-safe-transactions.routes')
      .then(m => m.MONEY_SAFE_TRANSACTION_ROUTES) 
  },


  { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
  { path: '**', redirectTo: 'dashboard' }
];