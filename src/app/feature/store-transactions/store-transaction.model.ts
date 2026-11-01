// store-transaction.model.ts
import { PageQuery } from '../../shared/models/paged.model';

export interface TransactionItem {
  item_id: number;
  item_name?: string;
  quantity: number;
}

export interface StoreTransaction {
  id: number;
  transaction_date: string;
  auditor_id: number;
  auditor_name: string;
  notes: string;
  out_store_id: number;
  out_store_name: string;
  in_store_id: number;
  in_store_name: string;
  transaction_items: TransactionItem[];
}

export interface SaveStoreTransaction {
  id: number;
  transaction_date: string;
  auditor_id: number;
  notes: string;
  out_store_id: number;
  in_store_id: number;
  transaction_items: { item_id: number; quantity: number }[];
}

export interface StoreTransactionFilter {
  dateFrom: string;
  dateTo: string;
  outStoreId: number;
  inStoreId: number;
  productId: number;
  search: string;
}
export type StoreTransactionQuery = StoreTransactionFilter & PageQuery;