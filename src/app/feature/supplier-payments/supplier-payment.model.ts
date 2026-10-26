// supplier-payment.model.ts
export interface SupplierPayment {
  id: number;
  date: string;
  supplier_id: number;
  supplier_name: string;
  invoice_id?: number | null;
  invoice_number?: number | null;
  money_safe_id: number;
  money_safe_name: string;
  amount: number;
  amount_currency: number;
  notes: string;
  auditor_id: number;
  auditor_name: string;
}

export interface SaveSupplierPayment {
  date: string;
  supplier_id: number;
  invoice_id: number | null;
  money_safe_id: number;
  amount: number;
  amount_currency: number;
  notes: string;
  auditor_id: number;
}

export interface PaymentAllocation {
  invoice_id: number;
  amount: number;
  amount_currency: number;
}

export interface SaveAllocatedPayment {
  date: string;
  supplier_id: number;
  money_safe_id: number;
  amount: number;
  amount_currency: number;
  notes: string;
  auditor_id: number;
  allocations: PaymentAllocation[];
}