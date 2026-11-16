// unfinished-orders-report/unfinished-orders-report.ts
import { Component, computed, inject, signal } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ReportService } from '../report.service';
import { DateQuery, UnfinishedOrderRow } from '../report.model';
import { enumLabel } from '../../orders/order.model';
import { OrderStatus } from '../../../shared/components/order-status/order-status';
import { exportFile } from '../../../shared/utils/download';
import { today } from '../../../shared/utils/date';
import { apiError } from '../../../shared/utils/api';

@Component({
  selector: 'app-unfinished-orders-report',
  imports: [RouterLink, FormsModule, DatePipe, DecimalPipe, OrderStatus],
  templateUrl: './unfinished-orders-report.html',
})
export class UnfinishedOrdersReport {
  private service = inject(ReportService);
  label = enumLabel;

  from = signal('');          // empty = all periods
  to = signal('');
  rows = signal<UnfinishedOrderRow[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);
  exporting = signal(false);
  exportError = signal<string | null>(null);

  totals = computed(() => {
    const r = this.rows();
    return {
      order_net: r.reduce((a, x) => a + x.order_net_total, 0),
      invoices: r.reduce((a, x) => a + x.invoices_count, 0),
      invoices_net: r.reduce((a, x) => a + x.invoices_net_total, 0),
    };
  });

  constructor() { this.load(); }

  private query(): DateQuery { return { dateFrom: this.from(), dateTo: this.to() }; }

  load() {
    if (this.from() && this.to() && this.to() < this.from()) { this.error.set('تاريخ النهاية قبل البداية'); return; }
    this.loading.set(true); this.error.set(null); this.exportError.set(null);
    this.service.unfinishedOrders(this.query()).subscribe({
      next: r => { this.rows.set(r); this.loading.set(false); },
      error: err => { this.error.set(apiError(err, 'فشل تحميل التقرير')); this.loading.set(false); },
    });
  }

  exportExcel() {
    exportFile(this.service.exportUnfinishedOrders(this.query()), `unfinished-orders-${today()}.xlsx`,
      { busy: this.exporting, error: this.exportError });
  }

  thisMonth() { this.from.set(today().slice(0, 8) + '01'); this.to.set(today()); this.load(); }
  allPeriods() { this.from.set(''); this.to.set(''); this.load(); }
}
