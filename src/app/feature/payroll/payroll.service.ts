// payroll.service.ts
import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { environment } from '../../../environments/environment.development';
import { ApiResponse } from '../../shared/models/api-response.model';
import { PageQuery, Paged } from '../../shared/models/paged.model';
import { unwrap } from '../../shared/utils/api';
import { toParams } from '../../shared/utils/params';
import { Adjustment, Payroll, PayrollFilter, PayrollPreview } from './payroll.model';

@Injectable({ providedIn: 'root' })
export class PayrollService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/employee-payrolls`;

  preview(employeeId: number, month: number, year: number): Observable<PayrollPreview> {
    const params = new HttpParams().set('employeeId', employeeId).set('month', month).set('year', year);
    return this.http.get<ApiResponse<PayrollPreview>>(`${this.baseUrl}/preview`, { params }).pipe(map(unwrap));
  }
  getPaged(q: PayrollFilter & PageQuery): Observable<Paged<Payroll>> {
    const { period, ...rest } = q;
    const params = toParams({ ...rest, month: period ? +period.slice(5, 7) : 0, year: period ? +period.slice(0, 4) : 0 });
    return this.http.get<ApiResponse<Paged<Payroll>>>(`${this.baseUrl}/paged`, { params }).pipe(map(unwrap));
  }
  getById(id: number): Observable<Payroll> {
    return this.http.get<ApiResponse<Payroll>>(`${this.baseUrl}/${id}`).pipe(map(unwrap));
  }
  review(b: object) { return this.http.post<ApiResponse<Payroll>>(`${this.baseUrl}/review`, b).pipe(map(unwrap)); }
  withdraw(id: number, b: object) { return this.http.post<void>(`${this.baseUrl}/${id}/withdraw`, b); }
  delete(id: number) { return this.http.delete<void>(`${this.baseUrl}/${id}`); }
  setExtra(commissionId: number, extra: number) {
    return this.http.put<void>(`${this.baseUrl}/commissions/${commissionId}/extra`, { extra_amount: extra });
  }
  addAdjustment(b: Partial<Adjustment>) { return this.http.post<ApiResponse<Adjustment>>(`${this.baseUrl}/adjustments`, b).pipe(map(unwrap)); }
  deleteAdjustment(id: number) { return this.http.delete<void>(`${this.baseUrl}/adjustments/${id}`); }
}