// employee.model.ts
import { PageQuery } from '../../shared/models/paged.model';

export interface EmployeeListItem {
  id: number;
  name: string;
  phone: string;
  department_name: string;
  manager_name: string;
  salary: number;
  hire_date: string;
  job_name: string;
  active: boolean;
}

export interface EmployeeFilter {
  search: string;
  departmentId: number;
  jobId: number;
  active: string;          // '' = all, 'true', 'false'
}
export type EmployeeQuery = EmployeeFilter & PageQuery;

export const MILITARY_STATUSES = [
  { value: 0, key: 'طالب', label: 'طالب' },
  { value: 1, key: 'تأجيل', label: 'تأجيل' },
  { value: 2, key: 'اعفاء_مؤقت', label: 'اعفاء مؤقت' },
  { value: 3, key: 'اعفاء_نهائي', label: 'اعفاء نهائي' },
  { value: 4, key: 'منتهي', label: 'منتهي' },
];
export const MARTIAL_STATUSES = [
  { value: 0, key: 'اعزب', label: 'اعزب' },
  { value: 1, key: 'متزوج', label: 'متزوج' },
];

export function enumValue(options: { value: number; key: string }[], v: unknown): number {
  if (typeof v === 'number') return v;
  const s = String(v ?? '');
  return options.find(o => o.key === s)?.value ?? (Number.isFinite(+s) && s !== '' ? +s : 0);
}


export interface Employee {
  id: number;
  name: string;
  job_id: number;
  department_id: number;
  city_id: number;
  salary: number;
  opening_balance: number;
  hire_date: string;
  birth_date?: string | null;
  active: boolean;
  user_id?: string | null;
  identification_number: string;
  personal_phone: string;
  work_phone: string;
  military_status: number | string;
  martial_status: number | string;
  kids_count?: number | null;
  education: string;
  education_spec: string;
  additional_address: string;
  notes: string;
}

export type SaveEmployee = Omit<Employee, 'department_id' | 'military_status' | 'martial_status'> & {
  department_id: number | null;
  military_status: number;
  martial_status: number;
};