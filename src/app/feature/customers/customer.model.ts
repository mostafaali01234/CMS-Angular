// customer.model.ts
export interface Customer {
  id: number;
  name: string;
  notes: string;
  phone: string;
  phone_2?: string | null;
  phone_3?: string | null;
  city_id: number;
  city_name?: string;
  address?: string | null;
  opening_balance: number;
  seller_id: number;
  seller_name?: string;
  regular_customer?: boolean | null;
  created_at_utc?: string | null;
  created_by?: string;
  updated_at_utc?: string | null;
  updated_by?: string;
}