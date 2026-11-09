// payroll.model.ts
export type PayrollStatus = 'Revised' | 'Withdrawn';
export const statusLabel = (s: PayrollStatus) => (s === 'Withdrawn' ? 'تم الصرف' : 'تم الاعتماد');
export const ROLE_LABELS: Record<string, string> = { Sales: 'بيع', Tech: 'تركيب', Manager: 'مجموعة' };
export const typeLabel = (t: string) => (t === 'Bonus' ? 'حافز' : 'خصم');

export interface Payroll {
  id: number; employee_id: number; employee_name: string; month: number; year: number;
  base_salary: number; sales_commission_total: number; tech_commission_total: number; manager_commission_total: number;
  loans_total: number; bonus_total: number; deductions_total: number; lunch_total: number; net_total: number;
  status: PayrollStatus; money_safe_id: number | null; money_safe_name: string;
  withdrawn_at: string | null; revised_by_name: string;
}

export interface PayrollCommissionRow {
  id: number; role: string; order_id: number; invoice_id: number; invoice_number: number;
  order_type: string; customer_name: string; seller_name: string; product_name: string;
  product_total: number; amount: number; extra_amount: number; total: number; paid_at: string | null;
}
export interface PayrollLoanRow { id:number, loan_id: number; installment_number: number; due_date: string; amount: number; notes: string; }

export interface PayrollPreview {
  employee_id: number; employee_name: string; month: number; year: number;
  base_salary: number; invoices_total: number;
  sales_commission_total: number; tech_commission_total: number; manager_commission_total: number;
  bonus_total: number; deductions_total: number; loans_total: number;
  lunch_amount: number; lunch_shifts: number; lunch_total: number;
  net_total: number; pending_commission_total: number;
  existing_payroll: Payroll | null;
  commissions: PayrollCommissionRow[]; adjustments: Adjustment[]; loans: PayrollLoanRow[];
}

export interface PayrollFilter { employeeId: number; period: string; status: string; }


export type AdjKind = 'Addition' | 'Deduction';
export const KIND_LABELS: Record<AdjKind, string> = { Addition: 'اضافة', Deduction: 'خصم' };

export const ADJ_TYPES: { value: string; label: string; kind: AdjKind | 'Both' }[] = [
  { value: 'Absence', label: 'غياب', kind: 'Deduction' },
  { value: 'Penalty', label: 'جزاء', kind: 'Deduction' },
  { value: 'Insurance', label: 'تأمين', kind: 'Deduction' },
  { value: 'Incentive', label: 'حافز', kind: 'Addition' },
  { value: 'Bonus', label: 'مكافأة', kind: 'Addition' },
  { value: 'Commission', label: 'عمولة', kind: 'Addition' },
  { value: 'Overtime', label: 'اضافي', kind: 'Addition' },
  { value: 'Other', label: 'اخرى', kind: 'Both' },
];
export const adjLabel = (v: string) => ADJ_TYPES.find(t => t.value === v)?.label ?? v;
export const typesFor = (k: AdjKind) => ADJ_TYPES.filter(t => t.kind === k || t.kind === 'Both');

export interface Adjustment {
  id: number; employee_id: number; operation_date: string; kind: AdjKind; type: string;
  amount: number; reason: string; approved_by_id: number | null; approved_by_name: string;
}
