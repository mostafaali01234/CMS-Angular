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

/** Ready-made filter for lists that have an `active` flag. */
export const activeOnly = (item: { active: boolean }) => item.active;

export interface CustomerOption extends LookupItem {
  phone?: string | null;
}

export interface ProductOption extends LookupItem {
  barcode?: string | null;
  sale_price: number;
  active: boolean;
}