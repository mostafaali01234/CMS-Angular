// shared/models/paged.model.ts
export interface Paged<T, S = unknown> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
  summary?: S;
}

export interface PageQuery { page: number; pageSize: number; }

export interface InvoiceListSummary {
  net: number;
  net_currency: number;
  paid: number;
  remaining: number;
  remaining_currency: number;
}