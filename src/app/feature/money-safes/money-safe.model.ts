// money-safe.model.ts
export interface MoneySafe {
  id: number;
  cod: number;
  name: string;
  notes?: string | null;
  active: boolean;
  is_multi_currency: boolean;
  opening_balance: number;
  opening_balance_currency: number;
  manager_id?: number | null;
  manager_name?: string;
  category_id?: number | null;
  category_name?: string;
  type_id?: number | null;
  type_name?: string;
  balance: number;
  balance_currency: number;
}

export type SaveMoneySafe = Omit<MoneySafe,
  'manager_name' | 'category_name' | 'type_name' | 'balance' | 'balance_currency'>;