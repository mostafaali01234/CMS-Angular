// supplier.model.ts
export interface Supplier {
  id: number;
  name: string;
  name_en: string;
  notes: string;
  phone: string;
  email: string;
  tax_card: string;
  commercial_register: string;
  city_id: number;
  city?: { id: number; name: string } | null;   // included by GetAll and GetById
  address: string;
  openingBalance: number;
  fixedDiscount: number;
}

export type SaveSupplier = Omit<Supplier, 'city'>;