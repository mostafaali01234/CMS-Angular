// payroll-adjustment.model.ts
import { PageQuery } from '../../shared/models/paged.model';

// kind: 1 = addition (حافز), 2 = deduction (خصم). key = C# enum name, in case the server sends names
export const ADJUSTMENT_TYPES = [
  { value: 2, key: 'Absence', label: 'غياب', kind: 2 },
  { value: 3, key: 'Penalty', label: 'جزاء', kind: 2 },
  { value: 4, key: 'Insurance', label: 'تأمين', kind: 2 },
  { value: 20, key: 'Incentive', label: 'حافز', kind: 1 },
  { value: 21, key: 'Bonus', label: 'مكافأة', kind: 1 },
  { value: 22, key: 'Commission', label: 'عمولة', kind: 1 },
  { value: 23, key: 'Overtime', label: 'اضافي', kind: 1 },
];
// types that exist but are not created by hand
const SYSTEM_TYPES = [
  { value: 1, key: 'LoanInstallment', label: 'قسط سلفة', kind: 2 },
  { value: 99, key: 'Other', label: 'اخرى', kind: 0 },
];
export const ALL_TYPES = [...SYSTEM_TYPES.slice(0, 1), ...ADJUSTMENT_TYPES, ...SYSTEM_TYPES.slice(1)];
export const DEDUCTION_TYPES = ADJUSTMENT_TYPES.filter(t => t.kind === 2);
export const ADDITION_TYPES = ADJUSTMENT_TYPES.filter(t => t.kind === 1);

export const typeLabel = (v: number) => ALL_TYPES.find(t => t.value === v)?.label ?? String(v);

export function typeValue(v: unknown): number {
  if (typeof v === 'number') return v;
  const s = String(v ?? '');
  return ALL_TYPES.find(t => t.key === s)?.value ?? (s !== '' && Number.isFinite(+s) ? +s : 0);
}
export const kindOfType = (type: number) => ALL_TYPES.find(t => t.value === type)?.kind ?? 0;

export interface AdjustmentListItem {
  id: number;
  employee_id: number;
  employee_name: string;
  operation_date: string;
  kind: number;
  type: number;
  amount: number;
  reason: string;
  created_at_utc: string;
  approved_by_name: string;
  from_loan: boolean;
}
export interface AdjustmentSummary { total_additions: number; total_deductions: number; }

export interface AdjustmentFilter {
  employeeId: number;
  kind: string;      // '' | '1' | '2'
  type: string;      // '' or a type value
  search: string;
  dateFrom: string;
  dateTo: string;
}
export type AdjustmentQuery = AdjustmentFilter & PageQuery;

export interface Adjustment {
  id: number;
  employee_id: number;
  operation_date: string;
  kind: number | string;
  type: number | string;
  amount: number;
  reason: string;
  approved_by_id?: number | null;
}
export type SaveAdjustment = Omit<Adjustment, 'kind' | 'type'> & { kind: number; type: number };