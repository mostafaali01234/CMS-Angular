// customer-payment.service.ts
import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { environment } from '../../../environments/environment.development';
import { ApiResponse } from '../../shared/models/api-response.model';
import { unwrap } from '../../shared/utils/api';
import {
  CustomerPayment, Refundable, SaveAllocatedCustomerPayment, SaveCustomerPayment,
} from './customer-payment.model';

@Injectable({ providedIn: 'root' })
export class CustomerPaymentService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/customer-payment`;

  getAll(): Observable<CustomerPayment[]> {
    return this.http.get<ApiResponse<CustomerPayment[]>>(this.baseUrl).pipe(map(unwrap));
  }
  /** one payment: advance, refund, or a regular payment tied to one invoice */
  create(p: SaveCustomerPayment): Observable<CustomerPayment> {
    return this.http.post<ApiResponse<CustomerPayment>>(this.baseUrl, p).pipe(map(unwrap));
  }
  /** one regular payment split across invoices; the rest goes to the customer balance */
  createAllocated(p: SaveAllocatedCustomerPayment): Observable<CustomerPayment[]> {
    return this.http.post<ApiResponse<CustomerPayment[]>>(`${this.baseUrl}/allocate`, p).pipe(map(unwrap));
  }
  getRefundable(returnId: number): Observable<Refundable> {
    return this.http.get<ApiResponse<Refundable>>(`${this.baseUrl}/refundable/${returnId}`).pipe(map(unwrap));
  }
  delete(id: number): Observable<void> { return this.http.delete<void>(`${this.baseUrl}/${id}`); }
}