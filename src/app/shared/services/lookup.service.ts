// shared/services/lookup.service.ts
import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable, shareReplay } from 'rxjs';
import { environment } from '../../../environments/environment.development';
import { ApiResponse } from '../models/api-response.model';
import {
  City, CountryState, EmployeeOption, LookupItem, ProductCategoryOption,
  ProductOption,
} from '../models/lookup.model';
import { unwrap } from '../utils/api';

export type LookupKey = 'states' | 'cities' | 'employees' | 'productCategories' | 'customers' | 'units' | 'products';

const byName = <T extends LookupItem>(list: T[]) =>
  [...list].sort((a, b) => a.name.localeCompare(b.name, 'ar'));

@Injectable({ providedIn: 'root' })
export class LookupService {
  private http = inject(HttpClient);
  private cache = new Map<LookupKey, Observable<unknown>>();

  /** Fetches `api/<path>` once per session, unwraps the envelope, optionally transforms. */
  private cached<T>(
    key: LookupKey,
    path: string,
    transform: (list: T[]) => T[] = list => list,
  ): Observable<T[]> {
    let source = this.cache.get(key) as Observable<T[]> | undefined;
    if (!source) {
      source = this.http
        .get<ApiResponse<T[]>>(`${environment.apiUrl}/${path}`)
        .pipe(map(unwrap), map(transform), shareReplay(1));
      this.cache.set(key, source);
    }
    return source;
  }

  /** Drop a cached list so the next dropdown refetches it. */
  clear(key: LookupKey) {
    this.cache.delete(key);
  }

  // used by StateCitySelect
  getStates() {
    return this.cached<CountryState>('states', 'countryState',
      list => [...list].sort((a, b) => a.order_number - b.order_number));
  }
  getCities() {
    return this.cached<City>('cities', 'city');
  }

  // ---- loaders for <app-lookup-select> ----
  readonly customers = () => this.cached<LookupItem>('customers', 'customer', byName);
  readonly employees = () => this.cached<EmployeeOption>('employees', 'employee', byName);
  readonly products = () => this.cached<ProductOption>('products', 'product', byName);
  readonly productCategories = () =>
    this.cached<ProductCategoryOption>('productCategories', 'productCategory', byName);
  readonly units = () => this.cached<LookupItem>('units', 'productUnit');
  readonly states = () => this.cached<LookupItem>('states', 'countryState');
}