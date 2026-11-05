// payroll-adjustment.service.ts
import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { environment } from '../../../environments/environment.development';
import { ApiResponse } from '../../shared/models/api-response.model';
import { Paged } from '../../shared/models/paged.model';
import { unwrap } from '../../shared/utils/api';
import { toParams } from '../../shared/utils/params';
import {
  Adjustment, AdjustmentListItem, AdjustmentQuery, AdjustmentSummary, SaveAdjustment,
} from './payroll-adjustment.model';

@Injectable({ providedIn: 'root' })
export class PayrollAdjustmentService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/payroll-adjustments`;

  getPaged(q: AdjustmentQuery): Observable<Paged<AdjustmentListItem, AdjustmentSummary>> {
    return this.http
      .get<ApiResponse<Paged<AdjustmentListItem, AdjustmentSummary>>>(`${this.baseUrl}/paged`, { params: toParams(q) })
      .pipe(map(unwrap));
  }

  getById(id: number): Observable<Adjustment> {
    return this.http.get<ApiResponse<Adjustment>>(`${this.baseUrl}/${id}`).pipe(map(unwrap));
  }

  create(a: SaveAdjustment): Observable<Adjustment> {
    return this.http.post<ApiResponse<Adjustment>>(this.baseUrl, a).pipe(map(unwrap));
  }

  update(id: number, a: SaveAdjustment): Observable<void> {
    return this.http.put<void>(`${this.baseUrl}/${id}`, a);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}