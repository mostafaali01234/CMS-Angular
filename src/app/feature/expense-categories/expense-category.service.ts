// expense-category.service.ts
import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment.development';
import { ApiResponse } from '../../shared/models/api-response.model';
import { unwrap } from '../../shared/utils/api';
import { LookupService } from '../../shared/services/lookup.service';
import { ExpenseCategory } from './expense-category.model';

@Injectable({ providedIn: 'root' })
export class ExpenseCategoryService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/expenseCategory`;
  private lookup = inject(LookupService);


  getAll(): Observable<ExpenseCategory[]> {
    return this.http.get<ApiResponse<ExpenseCategory[]>>(this.baseUrl).pipe(map(unwrap));
  }

  getById(id: number): Observable<ExpenseCategory> {
    return this.http.get<ApiResponse<ExpenseCategory>>(`${this.baseUrl}/${id}`).pipe(map(unwrap));
  }

  create(category: ExpenseCategory): Observable<ExpenseCategory> {
    return this.http
      .post<ApiResponse<ExpenseCategory>>(this.baseUrl, category)
      .pipe(map(unwrap), tap(() => this.lookup.clear('expenseCategories')));
  }

  update(id: number, category: ExpenseCategory): Observable<void> {
    return this.http
      .put<void>(`${this.baseUrl}/${id}`, category)
      .pipe(tap(() => this.lookup.clear('expenseCategories')));
  }

  delete(id: number): Observable<void> {
    return this.http
      .delete<void>(`${this.baseUrl}/${id}`)
      .pipe(tap(() => this.lookup.clear('expenseCategories')));
  }
}