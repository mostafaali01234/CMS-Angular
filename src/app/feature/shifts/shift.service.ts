// shift.service.ts
import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { environment } from '../../../environments/environment.development';
import { ApiResponse } from '../../shared/models/api-response.model';
import { unwrap } from '../../shared/utils/api';
import { Shift, ShiftBoard } from './shift.model';

@Injectable({ providedIn: 'root' })
export class ShiftService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/shift`;

  getByDate(date: string): Observable<Shift[]> {
    return this.http.get<ApiResponse<Shift[]>>(`${this.baseUrl}/day`, { params: new HttpParams().set('date', date) }).pipe(map(unwrap));
  }
  getBoard(storeId: number, date: string): Observable<ShiftBoard> {
    return this.http.get<ApiResponse<ShiftBoard>>(`${this.baseUrl}/board`,
      { params: new HttpParams().set('storeId', storeId).set('date', date) }).pipe(map(unwrap));
  }
  create(s: Partial<Shift>): Observable<Shift> {
    return this.http.post<ApiResponse<Shift>>(this.baseUrl, s).pipe(map(unwrap));
  }
  update(id: number, s: Partial<Shift>): Observable<void> {
    return this.http.put<void>(`${this.baseUrl}/${id}`, s);
  }
  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
  invoiceDraft(orderId: number) {
    return this.http.get<ApiResponse<any>>(`${environment.apiUrl}/sale-invoice/from-order/${orderId}`).pipe(map(unwrap));
  }
  addExpense(shiftId: number, b: object) { return this.http.post<ApiResponse<unknown>>(`${this.baseUrl}/${shiftId}/expense`, b).pipe(map(unwrap)); }
  addLoan(shiftId: number, b: object) { return this.http.post<ApiResponse<unknown>>(`${this.baseUrl}/${shiftId}/loan`, b).pipe(map(unwrap)); }
  addInvoice(shiftId: number, b: object) { return this.http.post<ApiResponse<unknown>>(`${this.baseUrl}/${shiftId}/invoice`, b).pipe(map(unwrap)); }

  deleteExpense(id: number) { return this.http.delete<void>(`${environment.apiUrl}/expense/${id}`); }
  deleteLoan(id: number) { return this.http.delete<void>(`${environment.apiUrl}/employee-loans/${id}`); }
  deleteInvoice(id: number) { return this.http.delete<void>(`${environment.apiUrl}/sale-invoice/${id}`); }

  getInvoice(id: number) {
    return this.http.get<ApiResponse<any>>(`${environment.apiUrl}/sale-invoice/${id}`).pipe(map(unwrap));
  }
  updateInvoice(id: number, b: object) {
    return this.http.put<void>(`${environment.apiUrl}/sale-invoice/${id}`, b);
  }

  addCustody(shiftId: number, b: object) { return this.http.post<ApiResponse<unknown>>(`${this.baseUrl}/${shiftId}/custody`, b).pipe(map(unwrap)); }
  addSettlement(shiftId: number, b: object) { return this.http.post<ApiResponse<unknown>>(`${this.baseUrl}/${shiftId}/settlement`, b).pipe(map(unwrap)); }
  deleteTransaction(shiftId: number, id: number) { return this.http.delete<void>(`${this.baseUrl}/${shiftId}/transaction/${id}`); }
}