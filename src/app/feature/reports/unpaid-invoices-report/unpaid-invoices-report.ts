// unpaid-invoices-report/unpaid-invoices-report.ts
import { Component, computed, inject, signal } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ReportService } from '../report.service';
import { DateQuery, UnpaidInvoiceRow } from '../report.model';
import { exportFile } from '../../../shared/utils/download';
import { today } from '../../../shared/utils/date';
import { apiError } from '../../../shared/utils/api';

@Component({
  selector: 'app-unpaid-invoices-report',
  imports: [RouterLink, FormsModule, DatePipe, DecimalPipe],
  templateUrl: './unpaid-invoices-report.html',
})
export class UnpaidInvoicesReport {
  private service = inject(ReportService);

  from = signal('');
  to = signal('');
  rows = signal<UnpaidInvoiceRow[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);
  exporting = signal(false);
  exportError = signal<string | null>(null);

  totals = computed(() => {
    const r = this.rows();
    const sum = (f: (x: UnpaidInvoiceRow) => number) => r.reduce((a, x) => a + f(x), 0);
    return {
      net: sum(x => x.net_total), returned: sum(x => x.returned_total), paid: sum(x => x.paid_total),
      remaining: sum(x => x.remaining), net_cur: sum(x => x.net_total_currency), remaining_cur: sum(x => x.remaining_currency),
    };
  });

  constructor() { this.load(); }

  private query(): DateQuery { return { dateFrom: this.from(), dateTo: this.to() }; }

  load() {
    if (this.from() && this.to() && this.to() < this.from()) { this.error.set('تاريخ النهاية قبل البداية'); return; }
    this.loading.set(true); this.error.set(null); this.exportError.set(null);
    this.service.unpaidInvoices(this.query()).subscribe({
      next: r => { this.rows.set(r); this.loading.set(false); },
      error: err => { this.error.set(apiError(err, 'فشل تحميل التقرير')); this.loading.set(false); },
    });
  }

  exportExcel() {
    exportFile(this.service.exportUnpaidInvoices(this.query()), `unpaid-invoices-${today()}.xlsx`,
      { busy: this.exporting, error: this.exportError });
  }

  thisMonth() { this.from.set(today().slice(0, 8) + '01'); this.to.set(today()); this.load(); }
  allPeriods() { this.from.set(''); this.to.set(''); this.load(); }
}
