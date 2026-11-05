// employee-loan.service.ts
import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { environment } from '../../../environments/environment.development';
import { ApiResponse } from '../../shared/models/api-response.model';
import { Paged } from '../../shared/models/paged.model';
import { unwrap } from '../../shared/utils/api';
import { toParams } from '../../shared/utils/params';
import { Loan, LoanListItem, LoanQuery, SaveLoan } from './employee-loan.model';

@Injectable({ providedIn: 'root' })
export class EmployeeLoanService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/employee-loans`;

  getPaged(q: LoanQuery): Observable<Paged<LoanListItem>> {
    return this.http
      .get<ApiResponse<Paged<LoanListItem>>>(`${this.baseUrl}/paged`, { params: toParams(q) })
      .pipe(map(unwrap));
  }

  getById(id: number): Observable<Loan> {
    return this.http.get<ApiResponse<Loan>>(`${this.baseUrl}/${id}`).pipe(map(unwrap));
  }

  create(l: SaveLoan): Observable<Loan> {
    return this.http.post<ApiResponse<Loan>>(this.baseUrl, l).pipe(map(unwrap));
  }

  update(id: number, l: SaveLoan): Observable<void> {
    return this.http.put<void>(`${this.baseUrl}/${id}`, l);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}