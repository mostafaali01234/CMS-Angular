// store.model.ts
export interface Store {
  id: number;
  name: string;
  manager_id: number;
  manager_name?: string;
  phone: string;
  notes?: string | null;
  city_id: number;
  city_name?: string;
  address: string;
  active: boolean;
}

export type SaveStore = Omit<Store, 'manager_name' | 'city_name'>;