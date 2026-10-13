import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable, shareReplay } from 'rxjs';
import { environment } from '../../../environments/environment.development';
import { ApiResponse } from '../models/api-response.model';
import { City, CountryState, EmployeeOption } from '../models/lookup.model';
import { unwrap } from '../utils/api';

@Injectable({ providedIn: 'root' })
export class LookupService {
  private http = inject(HttpClient);
  private states$?: Observable<CountryState[]>;
  private cities$?: Observable<City[]>;
  private employees$?: Observable<EmployeeOption[]>;


  getStates(): Observable<CountryState[]> {
    return (this.states$ ??= this.http
      .get<ApiResponse<CountryState[]>>(`${environment.apiUrl}/countryState`)
      .pipe(
        map(unwrap),
        map(list => [...list].sort((a, b) => a.order_number - b.order_number)),
        shareReplay(1),
      ));
  }

  getCities(): Observable<City[]> {
    return (this.cities$ ??= this.http
      .get<ApiResponse<City[]>>(`${environment.apiUrl}/city`)
      .pipe(map(unwrap), shareReplay(1)));
  }

  getEmployees(): Observable<EmployeeOption[]> {
  return (this.employees$ ??= this.http
    .get<ApiResponse<EmployeeOption[]>>(`${environment.apiUrl}/employee`)
    .pipe(
      map(unwrap),
      map(list => [...list].sort((a, b) => a.name.localeCompare(b.name, 'ar'))),
      shareReplay(1),
    ));
}
/** Call after creating/editing an employee so the next dropdown refetches. */
clearEmployeesCache() {
  this.employees$ = undefined;
}
}