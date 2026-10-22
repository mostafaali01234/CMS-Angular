// order.model.ts
export interface OrderItem {
  id?: number;
  product_id: number;
  product_name?: string;
  product_price: number;
  product_quantity: number;
  product_discount: number;
  product_total?: number;
  product_net_total?: number;
}

export interface Order {
  id: number;
  old_order_id: number;
  installation_date: string;
  status?: string | null;
  source: string;
  type: string;
  category_type: string;
  items_category: string;
  total: number;
  discount: number;
  net_total: number;
  shipping: boolean;
  customer_id: number;
  customer_name: string;
  customer_phone: string;
  city_id: number;
  city_name: string;
  country_state_name: string;
  line_id?: number | null;
  line_name: string;
  location_notes: string;
  seller_id: number;
  seller_name: string;
  tech_id?: number | null;
  tech_name: string;
  auditor_id: number;
  auditor_name: string;
  attachment_image: string;
  items: OrderItem[];
  notes?: OrderNote[];
  created_at_utc?: string | null;
}

export interface SaveOrderItem {
  product_id: number;
  product_price: number;
  product_quantity: number;
  product_discount: number;
}

export interface SaveOrder {
  id: number;
  installation_date: string;
  source: string;
  type: string;
  shipping: boolean;
  customer_id: number;
  city_id: number;
  line_id: number | null;
  location_notes: string;
  seller_id: number;
  auditor_id: number;
  attachment_image: string;
  items: SaveOrderItem[];
}

// the backend sends and accepts enum names
export const ORDER_SOURCES = ['Facebook_صفحة', 'WhatsApp', 'اتصال_مباشر', 'Market_place'];
export const ORDER_TYPES = ['جملة', 'تركيب', 'نص_جملة'];

/** 'نص_جملة' → 'نص جملة' */
export const enumLabel = (v?: string | null) => (v ?? '').replace(/_/g, ' ');

export interface OrderNote {
  id: number;
  notes: string;
  auditor_name: string;
  created_at_utc?: string | null;
  created_by?: string;
}

export interface CancelOrder {
  order_id: number;
  auditor_id: number;
  created_by?: string;
}
export interface SaveOrderNote {
  order_id: number;
  notes: string;
  auditor_id: number;
  created_by?: string;
}

export interface ChangeOrderTech {
  order_id: number;
  tech_id: number;
  tech_name: string;
  status: string;          // 'current'
  auditor_id: number;
  created_by?: string;
}


export interface PagedResponse<T> { 
    data: Paged<T>;
    succeeded: boolean;
 }

export interface Paged<T> { items: T[]; total_count: number; page: number; page_size: number; total_pages: number; }

export interface OrderFilter{
  page: number; page_size: number;
  date_from?: string; date_to?: string; search?: string;
  items_category?: string; status?: string; type?: string; source?: string;
  category_type?: string;
  seller_id?: number; tech_id?: number; country_state_id?: number;
}

export interface SaveMaintenance {
  old_order_id: number;
  auditor_id: number;
  created_by: string;
  notes: string;
}

export const CATEGORY_FILTERS = [
  { value: '', label: 'الكل' },
  { value: 'تركيب', label: 'تركيب/جملة' },
  { value: 'شحن', label: 'شحن' },
  { value: 'صيانة', label: 'صيانة' },
];

export interface OrderStats {
  total_today: number; 
  total_month: number;
  completed_today: number; 
  completed_month: number;
  cancelled_today: number; 
  cancelled_month: number;
  maintenance_month: number;
  maintenance_completed_month: number;
}