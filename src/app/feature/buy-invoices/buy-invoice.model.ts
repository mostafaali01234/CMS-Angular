// buy-invoice.model.ts

import { PageQuery } from "../../shared/models/paged.model";

// TODO: fill in the real enum names (the API sends names, not numbers)
export const INVOICE_TYPES = [
  { value: 'Buy', label: 'شراء' },
  { value: 'Buy_Return', label: 'مرتجع شراء' },
];

export const PRICE_TYPES = [
  { value: 'Egyptian', label: 'جنيه' },
  { value: 'Currency', label: 'عملة' },
];

export const typeLabel = (v?: string | null) =>
  INVOICE_TYPES.find(t => t.value === v)?.label ?? (v ?? '');

export interface BuyInvoiceItem {
  id?: number;
  product_id: number;
  product_name?: string;
  store_id: number;
  store_name?: string;
  project_id?: number | null;
  project_name?: string;
  product_notes: string;
  price_type: string;
  product_price: number;
  product_quantity: number;
  product_total?: number;
  product_discount: number;
  product_net_total?: number;
  original_item_id?: number | null;
}

export interface BuyInvoicePayment {
  id: number;
  payment_date: string;
  money_safe_id: number;
  amount: number;
  amount_currency: number;
  notes: string;
  auditor_name?: string;
  created_by?: string;
}

export interface BuyInvoice {
  id: number;
  number: number;
  type: string;
  date: string;
  notes: string;
  supplier_id: number;
  supplier_name: string;
  auditor_id: number;
  auditor_name: string;
  order_id?: number | null;
  original_invoice_id?: number | null;
  original_invoice_number?: number | null;
  total: number;
  discount: number;
  net_total: number;
  net_total_currency: number;
  paid_amount: number;
  remaining_amount: number;
  paid_amount_currency: number;
  remaining_amount_currency: number;
  returned_amount_currency: number;
  items: BuyInvoiceItem[];
  payment: BuyInvoicePayment[];     
  returned_amount: number;
}

export interface SaveBuyInvoiceItem {
  product_id: number;
  store_id: number;
  project_id: number | null;
  product_notes: string;
  price_type: string;
  product_price: number;
  product_quantity: number;
  product_discount: number;
}

export interface SaveInvoicePayment {
  payment_date: string;
  money_safe_id: number;
  amount: number;
  amount_currency: number;
  notes: string;
  auditor_id: number;
}

export interface SaveBuyInvoice {
  id: number;
  // number: number;
  type: string;
  date: string;
  notes: string;
  supplier_id: number;
  auditor_id: number;
  order_id: number | null;
  original_invoice_id: number | null;
  items: SaveBuyInvoiceItem[];
  payment: SaveInvoicePayment[];
}

export interface ReturnableItem {
  item_id: number;
  product_id: number;
  product_name: string;
  store_name: string;
  price_type: string;
  product_price: number;
  product_discount: number;
  original_quantity: number;
  returned_quantity: number;
  returnable_quantity: number;
}

export interface ReturnableInvoice {
  invoice_id: number;
  number: number;
  date: string;
  supplier_id: number;
  supplier_name: string;
  items: ReturnableItem[];
}

export interface SaveBuyReturn {
  // number: number;
  date: string;
  notes: string;
  original_invoice_id: number;
  auditor_id: number;
  items: { original_item_id: number; quantity: number }[];
}
export interface BuyInvoiceFilter {
  dateFrom: string;
  dateTo: string;
  supplierId: number;
  type: string;        // '' | 'Buy' | 'Buy_Return'
  payStatus: string;   // '' | 'unpaid' | 'paid'
  search: string;
  number: string;
}
export type BuyInvoiceQuery = BuyInvoiceFilter & PageQuery;