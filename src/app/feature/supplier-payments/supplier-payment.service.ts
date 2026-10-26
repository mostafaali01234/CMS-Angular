// supplier-payment.service.ts
import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { environment } from '../../../environments/environment.development';
import { ApiResponse } from '../../shared/models/api-response.model';
import { unwrap } from '../../shared/utils/api';
import { SaveAllocatedPayment, SaveSupplierPayment, SupplierPayment } from './supplier-payment.model';

@Injectable({ providedIn: 'root' })
export class SupplierPaymentService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/supplier-payment`;

  getAll(): Observable<SupplierPayment[]> {
    return this.http.get<ApiResponse<SupplierPayment[]>>(this.baseUrl).pipe(map(unwrap));
  }

  /** one payment, optionally tied to one invoice (used by the invoice page) */
  create(payment: SaveSupplierPayment): Observable<SupplierPayment> {
    return this.http.post<ApiResponse<SupplierPayment>>(this.baseUrl, payment).pipe(map(unwrap));
  }

  /** one amount split across invoices; the rest goes to the supplier balance */
  createAllocated(payment: SaveAllocatedPayment): Observable<SupplierPayment[]> {
    return this.http.post<ApiResponse<SupplierPayment[]>>(`${this.baseUrl}/allocate`, payment).pipe(map(unwrap));
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}