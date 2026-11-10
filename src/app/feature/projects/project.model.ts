// project.model.ts
export interface Project { id: number; name: string; notes: string; }

export interface ReviewSummary {
  project_id: number; project_name: string;
  sales_total: number; sales_returns_total: number; net_sales: number;
  purchases_total: number; purchases_returns_total: number; net_purchases: number;
  expenses_total: number; expenses_total_currency: number;
  total_cost: number; profit: number; margin_percent: number;
  loans_total: number; transfers_total: number;
  shifts_count: number; km_total: number;
}
export interface ExpenseTypeTotal { expense_type: string; count: number; amount: number; amount_currency: number; }
export interface InvoiceLine {
  invoice_id: number; invoice_number: number; date: string; type: number | string; party: string;
  product: string; notes: string; quantity: number; price: number; discount: number; net_total: number;
}
export interface ExpenseLine {
  id: number; date: string; expense_type: string; notes: string; money_safe: string; amount: number; amount_currency: number;
}
export interface LoanLine {
  id: number; date: string; employee: string; money_safe: string; installment_count: number; notes: string; amount: number;
}
export interface TransactionLine {
  id: number; date: string; transaction_type: number | string; out_money_safe: string; in_money_safe: string;
  notes: string; amount: number; amount_currency: number;
}
export interface ShiftLine {
  id: number; date: string; state: string; car: string; store: string;
  km_start: number; km_end: number; km: number; notes: string;
}
export interface ProjectReviewData {
  project_id: number; project_name: string; project_notes: string;
  date_from: string | null; date_to: string | null;
  summary: ReviewSummary; expenses_by_type: ExpenseTypeTotal[];
  sales: InvoiceLine[]; purchases: InvoiceLine[]; expenses: ExpenseLine[];
  loans: LoanLine[]; transactions: TransactionLine[]; shifts: ShiftLine[];
}

const INVOICE_TYPES: Record<string, string> = {
  '0': 'شراء', '1': 'مرتجع شراء', '2': 'بيع', '3': 'مرتجع بيع',
  Buy: 'شراء', Buy_Return: 'مرتجع شراء', Sale: 'بيع', Sale_Return: 'مرتجع بيع',
};
// works whether your API sends the enum as a number or as a name
export const invoiceTypeLabel = (t: number | string) => INVOICE_TYPES[String(t)] ?? String(t);