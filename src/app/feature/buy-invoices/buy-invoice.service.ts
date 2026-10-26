// buy-invoice.service.ts
import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { environment } from '../../../environments/environment.development';
import { ApiResponse } from '../../shared/models/api-response.model';
import { unwrap } from '../../shared/utils/api';
import { BuyInvoice, ReturnableInvoice, SaveBuyInvoice, SaveBuyReturn } from './buy-invoice.model';

@Injectable({ providedIn: 'root' })
export class BuyInvoiceService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/buy-invoice`;

  getAll(): Observable<BuyInvoice[]> {
    return this.http.get<ApiResponse<BuyInvoice[]>>(this.baseUrl).pipe(map(unwrap));
  }

  getById(id: number): Observable<BuyInvoice> {
    return this.http.get<ApiResponse<BuyInvoice>>(`${this.baseUrl}/${id}`).pipe(map(unwrap));
  }

  getUnpaid(supplierId: number): Observable<BuyInvoice[]> {
    return this.http.get<ApiResponse<BuyInvoice[]>>(`${this.baseUrl}/unpaid/${supplierId}`).pipe(map(unwrap));
  }

  create(invoice: SaveBuyInvoice): Observable<BuyInvoice> {
    return this.http.post<ApiResponse<BuyInvoice>>(this.baseUrl, invoice).pipe(map(unwrap));
  }

  update(id: number, invoice: SaveBuyInvoice): Observable<void> {
    return this.http.put<void>(`${this.baseUrl}/${id}`, invoice);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  getBySupplier(supplierId: number): Observable<BuyInvoice[]> {
    return this.http.get<ApiResponse<BuyInvoice[]>>(`${this.baseUrl}/by-supplier/${supplierId}`).pipe(map(unwrap));
  }

  getReturnable(invoiceId: number, excludeReturnId?: number): Observable<ReturnableInvoice> {
    const q = excludeReturnId ? `?excludeReturnId=${excludeReturnId}` : '';
    return this.http.get<ApiResponse<ReturnableInvoice>>(`${this.baseUrl}/${invoiceId}/returnable${q}`).pipe(map(unwrap));
  }

  createReturn(body: SaveBuyReturn): Observable<BuyInvoice> {
    return this.http.post<ApiResponse<BuyInvoice>>(`${this.baseUrl}/return`, body).pipe(map(unwrap));
  }

  updateReturn(id: number, body: SaveBuyReturn): Observable<void> {
    return this.http.put<void>(`${this.baseUrl}/return/${id}`, body);
  }
}