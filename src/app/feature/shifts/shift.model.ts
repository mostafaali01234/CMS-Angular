// shift.model.ts
export type TechType = 'Tech' | 'Half_Tech' | 'Tech_And_Helper' | 'Helper';
export const TECH_TYPES: { value: TechType; label: string }[] = [
  { value: 'Tech', label: 'فني' },
  { value: 'Half_Tech', label: 'نصف فني' },
  { value: 'Tech_And_Helper', label: 'فني ومساعد' },
  { value: 'Helper', label: 'مساعد' },
];
export const techLabel = (t: string) => TECH_TYPES.find(x => x.value === t)?.label ?? t;
export const isLead = (t: TechType) => t === 'Tech' || t === 'Tech_And_Helper';


export interface ShiftTech { id: number; date: string; tech_id: number; tech_name: string; tech_type: TechType; }
export interface TechRow { id: number; tech_id: number; tech_type: TechType; }


export const toRows = (techs: ShiftTech[]): TechRow[] =>
  techs.map(t => ({ id: t.id, tech_id: t.tech_id, tech_type: t.tech_type }));
export const techBody = (rows: TechRow[], date: string) =>
  rows.filter(r => r.tech_id > 0).map(r => ({ id: r.id, date, tech_id: r.tech_id, tech_name: '', tech_type: r.tech_type }));

export function validateTechs(rows: TechRow[]): string | null {
  const t = rows.filter(r => r.tech_id > 0);
  if (t.length === 0) return 'اختر موظفا واحدا على الأقل';
  if (new Set(t.map(r => r.tech_id)).size !== t.length) return 'لا يمكن تكرار نفس الموظف';
  if (t.filter(r => isLead(r.tech_type)).length !== 1) return 'يجب اختيار فني اساسي واحد (فني او فني ومساعد)';
  return null;
}

export interface ShiftInvoice {
  id: number; 
  number: number; 
  order_id: number; 
  customer_name: string; 
  net_total: number;
  payment: { id: number; amount: number }[];            // note: "payment", singular
  order_net_total: number;
}

export interface Shift {
  id: number; date: string;
  country_state_id: number; 
  country_state_name: string;
  car_id: number; 
  car_name: string;
  store_id: number; 
  store_name: string;
  km_start: number; 
  km_end: number;
  notes: string; 
  project_id: number | null; 
  project_name: string;
  techs: ShiftTech[];
  invoices: ShiftInvoice[];
  expenses: { id: number; amount: number; expense_type_id: number; expense_type_name: string; notes: string }[];
  loans: { id: number; amount: number; employee_id: number; employee_name: string; notes: string }[];
  transactions: ShiftTx[];
  money_safe_id: number | null;
  custody: number;
  delivered: number;
}

export interface ShiftItemRow {
  product_id: number; 
  product_name: string;
  opening: number; 
  transfer_in: number; 
  total: number;
  ordered_by_order: Record<string, number>;
  sold_by_invoice: Record<string, number>;
  consumed: number; 
  transfer_out: number; 
  other_change: number; 
  remaining: number;
}

export interface OpenOrder { id: number; customer_name: string; net_total: number; }
export interface ShiftBoard {
  shift: Shift | null; 
  items: ShiftItemRow[];
  primary_tech_name: string | null; 
  money_safe_id: number | null; 
  money_safe_name: string | null;
  open_orders: OpenOrder[];
}

export const paidOf = (i: ShiftInvoice) => i.payment.reduce((a, p) => a + p.amount, 0);


/** the figures of image 1, from one shift */
export function shiftTotals(s: Shift) {
  const revenue = s.invoices.reduce((a, i) => a + i.net_total, 0);
  const expenses = s.expenses.reduce((a, e) => a + e.amount, 0);
  const loans = s.loans.reduce((a, l) => a + l.amount, 0);
  const paid = s.invoices.reduce((a, i) => a + paidOf(i), 0);
  const custody = s.custody;
  return {
    revenue, expenses, net: paid - expenses - loans + custody,
    loans: s.loans.reduce((a, l) => a + l.amount, 0),
    paid: s.invoices.reduce((a, i) => a + paidOf(i), 0),
    custody: s.custody,
    delivered: s.delivered,
  };
}

export interface InvItem {
  id: number; product_id: number; product_name: string; store_id: number;
  product_quantity: number; product_price: number; product_discount: number;
  product_notes: string; price_type: number; original_item_id: number | null; project_id: number | null;
}

export const lineTotal = (i: InvItem) => i.product_quantity * i.product_price;
export const lineNet = (i: InvItem) => Math.max(0, lineTotal(i) - i.product_discount);

export const toInvItem = (it: any, keepId: boolean): InvItem => ({
  id: keepId ? (it.id ?? 0) : 0,
  product_id: it.product_id ?? 0, product_name: it.product_name ?? '', store_id: it.store_id ?? 0,
  product_quantity: it.product_quantity ?? 1, product_price: it.product_price ?? 0,
  product_discount: it.product_discount ?? 0, product_notes: it.product_notes ?? '',
  price_type: it.price_type ?? 0, original_item_id: keepId ? (it.original_item_id ?? null) : null,
  project_id: it.project_id ?? null,
});

export function validateItems(items: InvItem[]): string | null {
  const rows = items.filter(i => i.product_id > 0);
  if (rows.length === 0) return 'أضف منتجا واحدا على الأقل';
  if (rows.some(i => i.product_quantity <= 0)) return 'الكمية يجب ان تكون اكبر من صفر';
  if (rows.some(i => i.product_price < 0 || i.product_discount < 0)) return 'السعر والخصم لا يمكن ان يكونا سالبين';
  if (rows.some(i => i.product_discount > lineTotal(i))) return 'الخصم اكبر من اجمالي الصنف';
  return null;
}

export const toBodyItems = (items: InvItem[], storeId: number) =>
  items.filter(i => i.product_id > 0).map(i => ({
    ...i, store_id: i.store_id || storeId,
    product_total: lineTotal(i), product_net_total: lineNet(i),
  }));

export interface ShiftTx {
  id: number; transaction_amount: number; transaction_date: string;
  in_money_safe_id: number; out_money_safe_id: number;
}

export const custodyTx = (s: Shift) =>
  s.money_safe_id == null ? [] : s.transactions.filter(t => t.in_money_safe_id === s.money_safe_id);
export const settlementTx = (s: Shift) =>
  s.money_safe_id == null ? [] : s.transactions.filter(t => t.out_money_safe_id === s.money_safe_id);

