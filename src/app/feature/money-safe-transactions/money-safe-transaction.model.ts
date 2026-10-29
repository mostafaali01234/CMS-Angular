// money-safe-transaction.model.ts
import { PageQuery } from '../../shared/models/paged.model';

export const TRANSACTION_TYPES = [
  { value: 'تحويل', label: 'تحويل' },
];

export interface MoneySafeTransaction {
  id: number;
  transaction_date: string;
  transaction_notes: string;
  transaction_amount: number;
  transaction_amount_currency: number;
  transaction_type: string;
  auditor_id: number;
  auditor_name: string;
  out_money_safe_id: number;
  out_money_safe_name: string;
  in_money_safe_id: number;
  in_money_safe_name: string;
  project_id?: number | null;
  project_name: string;
  shift_id?: number | null;
}

export type SaveMoneySafeTransaction = Omit<MoneySafeTransaction,
  'auditor_name' | 'out_money_safe_name' | 'in_money_safe_name' | 'project_name'>;

export interface MoneySafeTransactionSummary { amount: number; amount_currency: number; }

export interface MoneySafeTransactionFilter {
  dateFrom: string;
  dateTo: string;
  moneySafeId: number;
  transactionType: string;
  projectId: number;
  search: string;
}
export type MoneySafeTransactionQuery = MoneySafeTransactionFilter & PageQuery;