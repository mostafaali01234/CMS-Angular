// sale-invoice.service.ts
import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { environment } from '../../../environments/environment.development';
import { ApiResponse } from '../../shared/models/api-response.model';
import { unwrap } from '../../shared/utils/api';
import { SaleInvoice, SaleInvoiceQuery, SaleReturnableInvoice, SaveSaleInvoice, SaveSaleReturn } from './sale-invoice.model';
import { InvoiceListSummary, Paged } from '../../shared/models/paged.model';
import { toParams } from '../../shared/utils/params';

@Injectable({ providedIn: 'root' })
export class SaleInvoiceService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/sale-invoice`;

  private list(url: string) { return this.http.get<ApiResponse<SaleInvoice[]>>(url).pipe(map(unwrap)); }

  getAll(): Observable<SaleInvoice[]> { return this.list(this.baseUrl); }
  getPaged(q: SaleInvoiceQuery): Observable<Paged<SaleInvoice, InvoiceListSummary>> {
    return this.http
      .get<ApiResponse<Paged<SaleInvoice, InvoiceListSummary>>>(`${this.baseUrl}/paged`, { params: toParams(q) })
      .pipe(map(unwrap));
  }
  getById(id: number): Observable<SaleInvoice> {
    return this.http.get<ApiResponse<SaleInvoice>>(`${this.baseUrl}/${id}`).pipe(map(unwrap));
  }
  getUnpaid(customerId: number) { return this.list(`${this.baseUrl}/unpaid/${customerId}`); }
  getByOrder(orderId: number) { return this.list(`${this.baseUrl}/by-order/${orderId}`); }
  getSalesByCustomer(customerId: number) { return this.list(`${this.baseUrl}/by-customer/${customerId}`); }
  getDraftFromOrder(orderId: number): Observable<SaleInvoice> {
    return this.http.get<ApiResponse<SaleInvoice>>(`${this.baseUrl}/from-order/${orderId}`).pipe(map(unwrap));
  }

  create(invoice: SaveSaleInvoice): Observable<SaleInvoice> {
    return this.http.post<ApiResponse<SaleInvoice>>(this.baseUrl, invoice).pipe(map(unwrap));
  }
  update(id: number, invoice: SaveSaleInvoice): Observable<void> {
    return this.http.put<void>(`${this.baseUrl}/${id}`, invoice);
  }
  delete(id: number): Observable<void> { return this.http.delete<void>(`${this.baseUrl}/${id}`); }

  getReturnable(invoiceId: number, excludeReturnId?: number): Observable<SaleReturnableInvoice> {
    const q = excludeReturnId ? `?excludeReturnId=${excludeReturnId}` : '';
    return this.http.get<ApiResponse<SaleReturnableInvoice>>(`${this.baseUrl}/${invoiceId}/returnable${q}`).pipe(map(unwrap));
  }
  createReturn(body: SaveSaleReturn): Observable<SaleInvoice> {
    return this.http.post<ApiResponse<SaleInvoice>>(`${this.baseUrl}/return`, body).pipe(map(unwrap));
  }
  updateReturn(id: number, body: SaveSaleReturn): Observable<void> {
    return this.http.put<void>(`${this.baseUrl}/return/${id}`, body);
  }

  exportExcel(id: number): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/${id}/export`, { responseType: 'blob' });
  }
}