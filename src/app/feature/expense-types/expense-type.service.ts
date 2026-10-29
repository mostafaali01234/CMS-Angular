// expense-type.service.ts
import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment.development';
import { ApiResponse } from '../../shared/models/api-response.model';
import { unwrap } from '../../shared/utils/api';
import { LookupService } from '../../shared/services/lookup.service';
import { ExpenseType } from './expense-type.model';

@Injectable({ providedIn: 'root' })
export class ExpenseTypeService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/expenseType`;
  private lookup = inject(LookupService);


  getAll(): Observable<ExpenseType[]> {
    return this.http.get<ApiResponse<ExpenseType[]>>(this.baseUrl).pipe(map(unwrap));
  }

  getById(id: number): Observable<ExpenseType> {
    return this.http.get<ApiResponse<ExpenseType>>(`${this.baseUrl}/${id}`).pipe(map(unwrap));
  }

  create(type: ExpenseType): Observable<ExpenseType> {
    return this.http
      .post<ApiResponse<ExpenseType>>(this.baseUrl, type)
      .pipe(map(unwrap), tap());
      // .pipe(map(unwrap), tap(() => this.lookup.clear('expenseTypes')));
  }

  update(id: number, type: ExpenseType): Observable<void> {
    return this.http
      .put<void>(`${this.baseUrl}/${id}`, type)
      // .pipe(tap(() => this.lookup.clear('expenseTypes')));
  }

  delete(id: number): Observable<void> {
    return this.http
      .delete<void>(`${this.baseUrl}/${id}`)
      // .pipe(tap(() => this.lookup.clear('expenseTypes')));
  }
}