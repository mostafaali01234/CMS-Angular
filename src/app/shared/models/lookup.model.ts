// shared/models/lookup.model.ts  (same content as before)
export interface CountryState { id: number; name: string; order_number: number; }
export interface City { id: number; name: string; state_id: number; }
export interface EmployeeOption {
  id: number;
  name: string;
  active: boolean;
  job_id: number;
  job_name?: string;
}