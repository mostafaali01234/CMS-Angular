// report.model.ts

// ---- rows x columns table (monthly sales, state / seller / tech x category)
export interface CrossTabRow {
  id: number;                 // 0 = the "not assigned" row
  name: string;
  values: number[];
  total: number;
}

export interface CrossTab {
  title: string;
  row_label: string;
  measure: 'count' | 'amount';
  date_from: string | null;
  date_to: string | null;
  columns: string[];
  rows: CrossTabRow[];
  column_totals: number[];
  grand_total: number;
}

export type ReportSource = 'orders' | 'invoices';
export type ReportRowBy = 'state' | 'seller' | 'tech';

/** every filter is optional; empty / 0 means "all" */
export interface MatrixQuery {
  dateFrom: string;
  dateTo: string;
  kind: string;               // '' = all | 'regular' | an order type | 'maintenance'
  sellerId: number;
  measure: 'count' | 'amount';
  includeCancelled: boolean;
}

export interface MonthlySalesQuery {
  year: number;
  half: 'first' | 'last';
  sellerId: number;
}

export interface DateQuery {
  dateFrom: string;
  dateTo: string;
}

// ---- 1
export interface UnfinishedOrderRow {
  order_id: number;
  created_at: string;
  installation_date: string;
  status: string;
  type: string;
  category: string;
  customer_name: string;
  customer_phone: string;
  state_name: string;
  city_name: string;
  seller_name: string;
  tech_name: string;
  order_net_total: number;
  invoices_count: number;
  invoice_numbers: number[];
  invoices_net_total: number;
}

// ---- 2
export interface AdvanceOrderRow {
  order_id: number;
  created_at: string;
  status: string;
  type: string;
  customer_name: string;
  customer_phone: string;
  state_name: string;
  seller_name: string;
  order_net_total: number;
  advance_count: number;
  advance_total: number;
  advance_total_currency: number;
  first_advance_date: string;
  last_advance_date: string;
  sale_invoices_count: number;
}

// ---- 3
export interface UnpaidInvoiceRow {
  invoice_id: number;
  number: number;
  date: string;
  age_days: number;
  customer_id: number;
  customer_name: string;
  customer_phone: string;
  order_id: number | null;
  seller_name: string;
  net_total: number;
  net_total_currency: number;
  returned_total: number;
  paid_total: number;
  remaining: number;
  remaining_currency: number;
}

// ---- 11
export interface MaintenanceTechRow {
  tech_id: number;
  tech_name: string;
  maintenance_count: number;
  maintenance_order_ids: number[];
  original_order_ids: number[];
  done_count: number;
  done_order_ids: number[];
  percent: number;
}

export interface MaintenanceReport {
  date_from: string | null;
  date_to: string | null;
  window_days: number;
  rows: MaintenanceTechRow[];
  total: MaintenanceTechRow;
}

// ---- screens
export const ORDER_KINDS_BASE = [
  { value: '', label: 'الكل' },
  { value: 'regular', label: 'بدون الصيانة' },
  { value: 'جملة', label: 'جملة' },
  { value: 'تركيب', label: 'تركيب' },
  { value: 'نص_جملة', label: 'نص جملة' },
];
export const ORDER_KIND_MAINTENANCE = { value: 'maintenance', label: 'صيانة فقط' };

export const HALVES = [
  { value: 'first' as const, label: 'الشهور الستة الاولى (يناير - يونيو)' },
  { value: 'last' as const, label: 'الشهور الستة الاخيرة (يوليو - ديسمبر)' },
];
