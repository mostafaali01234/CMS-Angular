// report.service.ts
import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { environment } from '../../../environments/environment.development';
import { ApiResponse } from '../../shared/models/api-response.model';
import { unwrap } from '../../shared/utils/api';
import { toParams } from '../../shared/utils/params';
import {
  AdvanceOrderRow, CrossTab, DateQuery, MaintenanceReport, MatrixQuery, MonthlySalesQuery,
  ReportRowBy, ReportSource, UnfinishedOrderRow, UnpaidInvoiceRow,
} from './report.model';

@Injectable({ providedIn: 'root' })
export class ReportService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/report`;

  private get<T>(path: string, query: object): Observable<T> {
    return this.http.get<ApiResponse<T>>(`${this.base}/${path}`, { params: toParams(query) }).pipe(map(unwrap));
  }
  private file(path: string, query: object): Observable<Blob> {
    return this.http.get(`${this.base}/${path}/export`, { params: toParams(query), responseType: 'blob' });
  }

  // 1
  unfinishedOrders(q: DateQuery) { return this.get<UnfinishedOrderRow[]>('unfinished-orders', q); }
  exportUnfinishedOrders(q: DateQuery) { return this.file('unfinished-orders', q); }

  // 2
  advanceOrders(q: DateQuery) { return this.get<AdvanceOrderRow[]>('advance-orders', q); }
  exportAdvanceOrders(q: DateQuery) { return this.file('advance-orders', q); }

  // 3
  unpaidInvoices(q: DateQuery) { return this.get<UnpaidInvoiceRow[]>('unpaid-invoices', q); }
  exportUnpaidInvoices(q: DateQuery) { return this.file('unpaid-invoices', q); }

  // 4
  monthlySales(q: MonthlySalesQuery) { return this.get<CrossTab>('monthly-sales', q); }
  exportMonthlySales(q: MonthlySalesQuery) { return this.file('monthly-sales', q); }

  // 5 - 10
  matrix(source: ReportSource, rowBy: ReportRowBy, q: MatrixQuery) {
    return this.get<CrossTab>(`matrix/${source}/${rowBy}`, q);
  }
  exportMatrix(source: ReportSource, rowBy: ReportRowBy, q: MatrixQuery) {
    return this.file(`matrix/${source}/${rowBy}`, q);
  }

  // 11
  maintenance(q: DateQuery) { return this.get<MaintenanceReport>('maintenance', q); }
  exportMaintenance(q: DateQuery) { return this.file('maintenance', q); }
}
