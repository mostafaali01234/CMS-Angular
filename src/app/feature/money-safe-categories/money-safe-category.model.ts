// money-safe-category.model.ts
export interface MoneySafeCategory {
  id: number;
  orderNumber: number;
  name: string;
  notes?: string | null;
}