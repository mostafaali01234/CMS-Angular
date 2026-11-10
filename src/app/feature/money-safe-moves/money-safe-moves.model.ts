// money-safe-moves.model.ts
export type MoveKind =
  | 'customer_payment' | 'customer_advance' | 'customer_refund'
  | 'supplier_payment' | 'supplier_refund'
  | 'expense' | 'payroll' | 'loan' | 'transfer_in' | 'transfer_out';

export const MOVE_LABELS: Record<MoveKind, string> = {
  customer_payment: 'دفعة عميل', customer_advance: 'دفعة مقدمة من عميل', customer_refund: 'مرتجع نقدي لعميل',
  supplier_payment: 'دفعة مورد', supplier_refund: 'استرداد من مورد',
  expense: 'مصروف', payroll: 'صرف مرتب', loan: 'سلفة',
  transfer_in: 'تحويل وارد', transfer_out: 'تحويل صادر',
};

// ASSUMPTION: MoneySafeDto serializes as id, name, balance, balance_currency, is_multi_currency
export interface SafeOption {
  id: number; name: string; balance: number; balance_currency: number; is_multi_currency: boolean;
}

export interface MoneySafeMove {
  kind: MoveKind; id: number; date: string; party: string; notes: string;
  in: number; out: number; in_currency: number; out_currency: number;
  balance: number; balance_currency: number;
}

export interface MovesSummary {
  money_safe_id: number; money_safe_name: string; is_multi_currency: boolean;
  opening_balance: number; opening_balance_currency: number;
  total_in: number; total_out: number; total_in_currency: number; total_out_currency: number;
  closing_balance: number; closing_balance_currency: number;
  current_balance: number; current_balance_currency: number;
}

export interface MovesFilter { moneySafeId: number; dateFrom: string; dateTo: string; }