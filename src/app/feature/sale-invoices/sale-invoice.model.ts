// sale-invoice.model.ts
import { PRICE_TYPES } from '../buy-invoices/buy-invoice.model';
export { PRICE_TYPES };

export const SALE_TYPES = [
  { value: 'Sale', label: 'بيع' },
  { value: 'Sale_Return', label: 'مرتجع بيع' },
];
export const saleTypeLabel = (v?: string | null) => SALE_TYPES.find(t => t.value === v)?.label ?? (v ?? '');

export interface SaleInvoiceItem {
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

export interface SaleInvoicePayment {
  id: number;
  type: string;
  payment_date: string;
  money_safe_id: number;
  amount: number;
  amount_currency: number;
  notes: string;
  auditor_name?: string;
}

export interface SaleInvoice {
  id: number;
  number: number;
  type: string;
  date: string;
  notes: string;
  customer_id: number;
  customer_name: string;
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
  paid_amount_currency: number;
  remaining_amount: number;
  remaining_amount_currency: number;
  returned_amount: number;
  returned_amount_currency: number;
  refunded_amount: number;
  refunded_amount_currency: number;
  order_net_total: number;
  order_advance_amount: number;
  order_advance_amount_currency: number;
  shift_id?: number | null;
  items: SaleInvoiceItem[];
  order_items: SaleInvoiceItem[];
  payment: SaleInvoicePayment[];
}

export interface SaveSaleInvoicePayment {
  payment_date: string;
  money_safe_id: number;
  amount: number;
  amount_currency: number;
  notes: string;
  auditor_id: number;
}

export interface SaveSaleInvoice {
  id: number;
  type: string;
  date: string;
  notes: string;
  customer_id: number;
  auditor_id: number;
  order_id: number | null;
  shift_id: number | null;
  items: Omit<SaleInvoiceItem, 'id' | 'product_name' | 'store_name' | 'project_name' | 'product_total' | 'product_net_total' | 'original_item_id'>[];
  payment: SaveSaleInvoicePayment[];
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

export interface SaleReturnableInvoice {
  invoice_id: number;
  number: number;
  date: string;
  customer_id: number;
  customer_name: string;
  items: ReturnableItem[];
}

export interface SaveSaleReturn {
  date: string;
  notes: string;
  original_invoice_id: number;
  auditor_id: number;
  items: { original_item_id: number; quantity: number }[];
}