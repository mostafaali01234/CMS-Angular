// expense.service.ts
import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { environment } from '../../../environments/environment.development';
import { ApiResponse } from '../../shared/models/api-response.model';
import { Paged } from '../../shared/models/paged.model';
import { unwrap } from '../../shared/utils/api';
import { toParams } from '../../shared/utils/params';
import { Expense, ExpenseQuery, ExpenseSummary, SaveExpense } from './expense.model';

@Injectable({ providedIn: 'root' })
export class ExpenseService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/expense`;

  getPaged(q: ExpenseQuery): Observable<Paged<Expense, ExpenseSummary>> {
    return this.http
      .get<ApiResponse<Paged<Expense, ExpenseSummary>>>(`${this.baseUrl}/paged`, { params: toParams(q) })
      .pipe(map(unwrap));
  }

  getById(id: number): Observable<Expense> {
    return this.http.get<ApiResponse<Expense>>(`${this.baseUrl}/${id}`).pipe(map(unwrap));
  }

  create(e: SaveExpense): Observable<Expense> {
    return this.http.post<ApiResponse<Expense>>(this.baseUrl, e).pipe(map(unwrap));
  }

  update(id: number, e: SaveExpense): Observable<void> {
    return this.http.put<void>(`${this.baseUrl}/${id}`, e);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}