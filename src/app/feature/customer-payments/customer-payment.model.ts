// customer-payment.model.ts
export const PAYMENT_TYPES = [
  { value: 'Regular_Payment', label: 'دفعة عادية' },
  { value: 'Advance_Payment', label: 'دفعة مقدمة' },
  { value: 'Refund_Payment', label: 'استرداد' },
];
export const paymentLabel = (v?: string | null) => PAYMENT_TYPES.find(t => t.value === v)?.label ?? (v ?? '');

export interface CustomerPayment {
  id: number;
  date: string;
  type: string;
  customer_id: number;
  customer_name: string;
  invoice_id?: number | null;
  invoice_number?: number | null;
  invoice_order_id?: number | null;
  advance_payment_order_id?: number | null;
  money_safe_id: number;
  money_safe_name: string;
  amount: number;
  amount_currency: number;
  notes: string;
  auditor_id: number;
  auditor_name: string;
}

export interface SaveCustomerPayment {
  date: string;
  type: string;
  customer_id: number;
  invoice_id: number | null;
  advance_payment_order_id: number | null;
  money_safe_id: number;
  amount: number;
  amount_currency: number;
  notes: string;
  auditor_id: number;
}

export interface PaymentAllocation { invoice_id: number; amount: number; amount_currency: number; }

export interface SaveAllocatedCustomerPayment {
  date: string;
  customer_id: number;
  money_safe_id: number;
  amount: number;
  amount_currency: number;
  notes: string;
  auditor_id: number;
  allocations: PaymentAllocation[];
}

export interface Refundable { amount: number; amount_currency: number; }