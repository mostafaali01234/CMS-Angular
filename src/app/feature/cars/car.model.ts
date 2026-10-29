// car.model.ts
import { PageQuery } from '../../shared/models/paged.model';

export interface Car {
  id: number;
  name: string;
  notes: string;
  driver_id: number;
  driver_name: string;
  plat_number: string;
  model: string;
  oil_change_rate: number;
  filter_change_rate: number;
  sk_change_rate: number;
  tire_change_rate: number;
  license_start_date: string;
  license_end_date: string;
  insurance_start_date: string;
  insurance_end_date: string;
  insurance_company_name: string;
  owner_name: string;
  motor_number: string;
  chassis_number: string;
}

export type SaveCar = Omit<Car, 'driver_name'>;

export interface CarFilter {
  search: string;
  driverId: number;
  expiry: string;     // '' | 'any' | 'license_soon' | 'license_expired' | 'insurance_soon' | 'insurance_expired'
}
export type CarQuery = CarFilter & PageQuery;

export const EXPIRY_WARNING_DAYS = 30;   // the same window as the server

export const EXPIRY_FILTERS = [
  { value: '', label: 'كل السيارات' },
  { value: 'any', label: 'تحتاج متابعة' },
  { value: 'license_expired', label: 'رخصة منتهية' },
  { value: 'license_soon', label: 'رخصة تنتهي قريبا' },
  { value: 'insurance_expired', label: 'تأمين منتهي' },
  { value: 'insurance_soon', label: 'تأمين ينتهي قريبا' },
];

/** days until a date (negative = already expired), by local calendar day */
export const daysLeft = (date: string) => {
  const d = new Date(date.slice(0, 10) + 'T00:00:00');
  const t = new Date();
  t.setHours(0, 0, 0, 0);
  return Math.round((d.getTime() - t.getTime()) / 86_400_000);
};