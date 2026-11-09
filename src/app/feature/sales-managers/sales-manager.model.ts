// sales-manager.model.ts
export interface Member { id: number; name: string; }
export interface SalesManagerGroup {
  id: number; manager_id: number; manager_name: string;
  percent: number; active: boolean; notes: string;
  sellers: Member[]; products: Member[];
}