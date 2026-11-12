// product-assembly.model.ts
// The backend sends the operation type as the (Arabic) enum name.
export type AssemblyOperationType = 'تجميع_اصناف' | 'تصنيع_زمبلكات';

export const ASSEMBLY_TYPES: { value: AssemblyOperationType; label: string }[] = [
  { value: 'تجميع_اصناف', label: 'تجميع اصناف' },
  { value: 'تصنيع_زمبلكات', label: 'تصنيع زمبلكات' },
];
export const assemblyTypeLabel = (v?: string | null) =>
  ASSEMBLY_TYPES.find(t => t.value === v)?.label ?? (v ?? '');

// ---------- definitions (the recipe of an assembled product) ----------
export interface AssemblyInProduct {
  in_product_id: number;
  in_product_name?: string;
  in_product_quantity: number;          // consumed for ONE unit of the assembled product
}

export interface AssemblyDefinition {
  out_product_id: number;               // also the key: one definition per assembled product
  out_product_name: string;
  operation_type: AssemblyOperationType;
  first_tech_comm: number;              // technician commission per unit made
  second_tech_comm: number;
  in_product_list: AssemblyInProduct[];
  created_at_utc?: string | null;
  created_by?: string;
  updated_at_utc?: string | null;
  updated_by?: string;
}

export interface SaveAssemblyDefinition {
  out_product_id: number;
  operation_type: AssemblyOperationType;
  first_tech_comm: number;
  second_tech_comm: number;
  in_product_list: { in_product_id: number; in_product_quantity: number }[];
}

// ---------- operations ----------
export interface AssemblyOperationItem {
  product_id: number;
  product_name: string;
  unit_quantity: number;                // for one unit of the assembled product
  quantity: number;                     // for the whole operation
}

export interface AssemblyOperation {
  id: number;
  out_product_id: number;
  out_product_name: string;
  out_store_id: number;                 // the components leave this store
  out_store_name: string;
  in_store_id: number;                  // the assembled product enters this store
  in_store_name: string;
  quantity: number;
  operation_date: string;
  operation_type: AssemblyOperationType;
  first_tech_id: number | null;
  first_tech_name: string;
  second_tech_id: number | null;
  second_tech_name: string;
  notes: string;
  items: AssemblyOperationItem[];       // read-only snapshot of the recipe used
  created_at_utc?: string | null;
  created_by?: string;
  updated_at_utc?: string | null;
  updated_by?: string;
}

export interface SaveAssemblyOperation {
  id: number;
  out_product_id: number;
  out_store_id: number;
  in_store_id: number;
  quantity: number;
  operation_date: string;
  operation_type: AssemblyOperationType;
  first_tech_id: number | null;
  second_tech_id: number | null;
  notes: string;
}

export interface AssemblyOperationFilter {
  dateFrom: string;
  dateTo: string;
  productId: number;
  outStoreId: number;
  inStoreId: number;
  operationType: string;
  search: string;
}

export interface AssemblyDefinitionFilter {
  operationType: string;
  search: string;
}
