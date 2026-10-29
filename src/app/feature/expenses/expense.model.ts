// expense.model.ts
import { PageQuery } from '../../shared/models/paged.model';

export interface ExpenseData {
  car_id?: number | null;
  car_name?: string;
  oil_start_km?: number | null;
  oil_end_km?: number | null;
  gas_current_km?: number | null;
  gas_litres_count?: number | null;
}

export interface Expense {
  id: number;
  expense_type_id: number;
  expense_type_name: string;
  expense_category_id?: number | null;
  expense_category_name: string;
  amount: number;
  amount_currency: number;
  notes: string;
  date: string;
  data?: ExpenseData | null;
  shift_id?: number | null;
  money_safe_id: number;
  money_safe_name: string;
  auditor_id: number;
  auditor_name: string;
  project_id?: number | null;
  project_name: string;
  created_at_utc?: string | null;
  created_by: string;
}

export interface SaveExpense {
  id: number;
  expense_type_id: number;
  amount: number;
  amount_currency: number;
  notes: string;
  date: string;
  data: ExpenseData | null;
  shift_id: number | null;
  money_safe_id: number;
  auditor_id: number;
  project_id: number | null;
}

export interface ExpenseSummary { amount: number; amount_currency: number; }

export interface ExpenseFilter {
  dateFrom: string;
  dateTo: string;
  categoryId: number;
  expenseTypeId: number;
  search: string;
}
export type ExpenseQuery = ExpenseFilter & PageQuery;