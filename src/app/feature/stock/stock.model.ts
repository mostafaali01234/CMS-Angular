// stock.model.ts
export const OPERATION_TYPES = [
  { value: 'store_transaction', label: 'تحويل مخازن' },
  { value: 'buy_invoice', label: 'فاتورة شراء' },
  { value: 'sale_invoice', label: 'فاتورة بيع' },
];
export const operationLabel = (v?: string | null) =>
  OPERATION_TYPES.find(o => o.value === v)?.label ?? (v ?? '');

export interface StockRow {
  product_id: number; product_name: string; category_name: string; barcode: string; quantity: number;
}
export interface StockSummary { total_quantity: number; }
export interface StockFilter { storeId: number; categoryId: number; search: string; includeZero: boolean; }

export interface MatrixStore { id: number; name: string; }
export interface MatrixRow {
  product_id: number; product_name: string; category_name: string; barcode: string;
  counts: number[]; total: number;
}
export interface MatrixHeader { stores: MatrixStore[]; totals: number[]; grand_total: number; }
export interface MatrixFilter { categoryId: number; search: string; includeZero: boolean; }

export interface StockMove {
  date: string;
  operation_type: string;
  doc_id: number;
  doc_number?: number | null;
  is_return: boolean;
  order_id?: number | null;
  product_id: number;
  product_name: string;
  category_name: string;
  product_count: number;
  out_store_name: string;
  in_store_name: string;
  direction: string;
  stock_after: number;
  customer_name?: string | null;
  supplier_name?: string | null;
  seller_name?: string | null;
  product_price?: number | null;
  invoice_total?: number | null;
  invoice_paid?: number | null;
  invoice_remaining?: number | null;
  commission: number;
}
export interface MovesSummary { total_in: number; total_out: number; }
export interface MovesFilter {
  storeId: number; productId: number; orderId: string; operationType: string; dateFrom: string; dateTo: string;
}

/** where a move's document opens */
export function docLink(m: { operation_type: string; doc_id: number; is_return: boolean }): any[] {
  switch (m.operation_type) {
    case 'store_transaction': return ['/store-transactions', m.doc_id, 'edit'];
    case 'buy_invoice':
      return m.is_return ? ['/buy-invoices', 'returns', m.doc_id, 'edit'] : ['/buy-invoices', m.doc_id, 'edit'];
    default:
      return m.is_return ? ['/sale-invoices', 'returns', m.doc_id, 'edit'] : ['/sale-invoices', m.doc_id, 'edit'];
  }
}