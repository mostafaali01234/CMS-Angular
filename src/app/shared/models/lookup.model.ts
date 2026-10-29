// shared/models/lookup.model.ts  (same content as before)
export interface CountryState { id: number; name: string; order_number: number; }
export interface City { id: number; name: string; state_id: number; }

// shared/models/lookup.model.ts  (add the base type; keep the existing ones)
export interface LookupItem {
  id: number;
  name: string;
}

export interface EmployeeOption extends LookupItem {
  active: boolean;
  job_id: number;
  job_name?: string;
}

export interface ProductCategoryOption extends LookupItem {}
export interface ExpenseCategoryOption extends LookupItem {}

/** Ready-made filter for lists that have an `active` flag. */
export const activeOnly = (item: { active: boolean }) => item.active;

export interface CustomerOption extends LookupItem {
  phone?: string | null;
  city_id?: number | null;
  state_id?: number | null;
}
export interface MoneySafeCategoryOption extends LookupItem {
  orderNumber?: number;
}

export interface ProductOption extends LookupItem {
  barcode?: string | null;
  sale_price: number;
  buy_price: number;
  active: boolean;
}

export interface MoneySafeTypeOption extends LookupItem {
  cod: number;
}

export interface MoneySafeOption extends LookupItem {
  cod: number;
  active: boolean;
  is_multi_currency: boolean;
  type_id?: number | null;
  category_id?: number | null;
}

export interface StoreOption extends LookupItem {
  active: boolean;
  city_id: number;
  manager_id: number;
}

export interface SupplierOption extends LookupItem {
  phone?: string | null;
}

export interface ExpenseTypeOption extends LookupItem {
  category_id?: number | null;     
}