// advance-orders-report/advance-orders-report.ts
import { Component, computed, inject, signal } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ReportService } from '../report.service';
import { AdvanceOrderRow, DateQuery } from '../report.model';
import { enumLabel } from '../../orders/order.model';
import { OrderStatus } from '../../../shared/components/order-status/order-status';
import { exportFile } from '../../../shared/utils/download';
import { today } from '../../../shared/utils/date';
import { apiError } from '../../../shared/utils/api';

@Component({
  selector: 'app-advance-orders-report',
  imports: [RouterLink, FormsModule, DatePipe, DecimalPipe, OrderStatus],
  templateUrl: './advance-orders-report.html',
})
export class AdvanceOrdersReport {
  private service = inject(ReportService);
  label = enumLabel;

  from = signal('');
  to = signal('');
  rows = signal<AdvanceOrderRow[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);
  exporting = signal(false);
  exportError = signal<string | null>(null);

  totals = computed(() => {
    const r = this.rows();
    return {
      order_net: r.reduce((a, x) => a + x.order_net_total, 0),
      count: r.reduce((a, x) => a + x.advance_count, 0),
      advance: r.reduce((a, x) => a + x.advance_total, 0),
      advance_cur: r.reduce((a, x) => a + x.advance_total_currency, 0),
    };
  });

  constructor() { this.load(); }

  private query(): DateQuery { return { dateFrom: this.from(), dateTo: this.to() }; }

  load() {
    if (this.from() && this.to() && this.to() < this.from()) { this.error.set('تاريخ النهاية قبل البداية'); return; }
    this.loading.set(true); this.error.set(null); this.exportError.set(null);
    this.service.advanceOrders(this.query()).subscribe({
      next: r => { this.rows.set(r); this.loading.set(false); },
      error: err => { this.error.set(apiError(err, 'فشل تحميل التقرير')); this.loading.set(false); },
    });
  }

  exportExcel() {
    exportFile(this.service.exportAdvanceOrders(this.query()), `advance-orders-${today()}.xlsx`,
      { busy: this.exporting, error: this.exportError });
  }

  thisMonth() { this.from.set(today().slice(0, 8) + '01'); this.to.set(today()); this.load(); }
  allPeriods() { this.from.set(''); this.to.set(''); this.load(); }
}
