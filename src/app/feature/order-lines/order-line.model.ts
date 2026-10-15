// order-line.model.ts
import { LookupItem } from '../../shared/models/lookup.model';

export interface OrderLine {
  id: number;
  name: string;
  notes?: string | null;
  manager_id: number;
  manager?: { id: number; name?: string } | null;   // only if the backend Includes it
  cities?: LookupItem[];                             // only if the backend Includes it
  productCategories?: LookupItem[];                  // only if the backend Includes it
}

// order-line.model.ts: add the payload type
export interface SaveOrderLine {
  name: string;
  notes: string;
  manager_id: number;
  city_ids: number[];
  category_ids: number[];
}