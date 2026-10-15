// product.model.ts
export interface UnitCommission {
  unit_id: number;
  sales_wholesale_comm_percent: number;
  sales_half_wholesale_comm_percent: number;
  sales_retail_comm_percent: number;
  tech_comm: number;
  assistant_1_comm: number;
  assistant_2_comm: number;
  assistant_3_comm: number;
}

export interface Product {
  id: number;
  name: string;
  description?: string | null;
  barcode?: string | null;
  category_id: number;
  category_name?: string;
  buy_price: number;
  sale_price: number;
  storage_type: string;
  product_type: string;
  active: boolean;
  has_serial: boolean;
  enable_counter: boolean;
  enable_add_order: boolean;
  arrange_order?: number | null;
  inspection_commission_deduction_percent: number;
  unit_commissions: UnitCommission[];
}

export type SaveProduct = Omit<Product, 'category_name'>;

export const STORAGE_TYPES = [
  { value: 'مخزني', label: 'مخزني' },
  { value: 'خدمي', label: 'خدمي' },
];

export const PRODUCT_TYPES = [
  { value: 'اصناف', label: 'اصناف' },
  { value: 'عدة', label: 'عدة' },
  { value: 'مهام', label: 'مهام' },
];