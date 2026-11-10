// employee-balance.service.ts
import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { environment } from '../../../environments/environment.development';
import { ApiResponse } from '../../shared/models/api-response.model';
import { unwrap } from '../../shared/utils/api';
import { EmployeeBalance } from './employee-balance.model';

@Injectable({ providedIn: 'root' })
export class EmployeeBalanceService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/employee-balance`;

  private params(employeeId: number, from: string, to: string) {
    let p = new HttpParams().set('employeeId', employeeId);
    if (from) p = p.set('dateFrom', from);
    if (to) p = p.set('dateTo', to);
    return p;
  }

  get(employeeId: number, from: string, to: string): Observable<EmployeeBalance> {
    return this.http.get<ApiResponse<EmployeeBalance>>(this.baseUrl, { params: this.params(employeeId, from, to) }).pipe(map(unwrap));
  }
  export(employeeId: number, from: string, to: string): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/export`, { params: this.params(employeeId, from, to), responseType: 'blob' });
  }
}