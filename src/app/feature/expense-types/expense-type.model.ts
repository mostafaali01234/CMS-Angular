import { ExpenseCategory } from "../expense-categories/expense-category.model";

// expense-type.model.ts
export interface ExpenseType {
  id: number;
  name: string;
  category_id: number;
  category?: ExpenseCategory;
}