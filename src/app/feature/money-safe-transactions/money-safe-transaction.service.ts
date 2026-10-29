// money-safe-transaction.service.ts
import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { environment } from '../../../environments/environment.development';
import { ApiResponse } from '../../shared/models/api-response.model';
import { Paged } from '../../shared/models/paged.model';
import { unwrap } from '../../shared/utils/api';
import { toParams } from '../../shared/utils/params';
import {
  MoneySafeTransaction, MoneySafeTransactionQuery, MoneySafeTransactionSummary, SaveMoneySafeTransaction,
} from './money-safe-transaction.model';

@Injectable({ providedIn: 'root' })
export class MoneySafeTransactionService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/moneySafeTransaction`;

  getPaged(q: MoneySafeTransactionQuery): Observable<Paged<MoneySafeTransaction, MoneySafeTransactionSummary>> {
    return this.http
      .get<ApiResponse<Paged<MoneySafeTransaction, MoneySafeTransactionSummary>>>(`${this.baseUrl}/paged`, { params: toParams(q) })
      .pipe(map(unwrap));
  }

  getById(id: number): Observable<MoneySafeTransaction> {
    return this.http.get<ApiResponse<MoneySafeTransaction>>(`${this.baseUrl}/${id}`).pipe(map(unwrap));
  }

  create(t: SaveMoneySafeTransaction): Observable<MoneySafeTransaction> {
    return this.http.post<ApiResponse<MoneySafeTransaction>>(this.baseUrl, t).pipe(map(unwrap));
  }

  update(id: number, t: SaveMoneySafeTransaction): Observable<void> {
    return this.http.put<void>(`${this.baseUrl}/${id}`, t);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}