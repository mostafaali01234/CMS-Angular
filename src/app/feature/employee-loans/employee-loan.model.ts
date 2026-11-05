// employee-loan.model.ts
import { PageQuery } from '../../shared/models/paged.model';

export interface LoanListItem {
  id: number;
  employee_id: number;
  employee_name: string;
  approved_by_name: string;
  amount: number;
  money_safe_name: string;
  installment_count: number;
  start_date: string;
  created_at_utc: string;
  project_name: string;
  deducted_count: number;
  skipped_count: number;
  pending_amount: number;
}

export interface LoanFilter {
  employeeId: number;
  mode: string;          // '' | 'safe' | 'installments'
  search: string;
  dateFrom: string;
  dateTo: string;
}
export type LoanQuery = LoanFilter & PageQuery;

export interface LoanInstallment {
  id: number;
  installment_number: number;
  due_date: string;
  amount: number;
  status: number | string;
}

export interface Loan {
  id: number;
  employee_id: number;
  approved_by_id?: number | null;
  amount: number;
  money_safe_id?: number | null;
  installment_count: number;
  start_date: string;
  notes: string;
  project_id?: number | null;
  shift_id?: number | null;
  installments: LoanInstallment[];
}

export type SaveLoan = Omit<Loan, 'installments'>;

/** Pending = 1, Deducted = 2, Skipped = 3; the server may send a number or the name */
export function installmentStatus(v: number | string): 'Pending' | 'Deducted' | 'Skipped' {
  if (v === 2 || v === 'Deducted') return 'Deducted';
  if (v === 3 || v === 'Skipped') return 'Skipped';
  return 'Pending';
}
export const STATUS_LABELS = { Pending: 'معلق', Deducted: 'تم الخصم', Skipped: 'تم التخطي' };