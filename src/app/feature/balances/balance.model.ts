// balance.model.ts
export type PartyKind = 'customer' | 'supplier';

export interface PartyBalance {
  id: number;
  name: string;
  phone: string;
  opening_balance: number;
  invoices_total: number;
  returns_total: number;
  payments_total: number;
  refunds_total: number;
  balance: number;
  invoices_total_currency: number;
  returns_total_currency: number;
  payments_total_currency: number;
  refunds_total_currency: number;
  balance_currency: number;
}

export interface StatementLine {
  date: string;
  kind: 'invoice' | 'return' | 'payment' | 'advance' | 'refund';
  id: number;
  number?: number | null;
  ref_id?: number | null;
  ref_number?: number | null;
  order_id?: number | null;
  notes: string;
  increase: number;
  decrease: number;
  increase_currency: number;
  decrease_currency: number;
  balance: number;
  balance_currency: number;
}

export interface Statement {
  party_id: number;
  party_name: string;
  party_phone: string;
  opening_balance: number;
  opening_balance_currency: number;
  closing_balance: number;
  closing_balance_currency: number;
  lines: StatementLine[];
}

export const KIND_LABELS: Record<string, string> = {
  invoice: 'فاتورة', return: 'مرتجع', payment: 'دفعة', advance: 'دفعة مقدمة', refund: 'استرداد',
};

/** what a positive balance means */
export const sideLabel = (kind: PartyKind, balance: number) =>
  balance === 0 ? '' : kind === 'customer'
    ? (balance > 0 ? 'مدين (على العميل)' : 'دائن (للعميل)')
    : (balance > 0 ? 'دائن (للمورد)' : 'مدين (على المورد)');