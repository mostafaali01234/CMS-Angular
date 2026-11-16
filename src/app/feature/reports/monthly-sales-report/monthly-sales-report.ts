// monthly-sales-report/monthly-sales-report.ts
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ReportService } from '../report.service';
import { CrossTab, HALVES, MonthlySalesQuery } from '../report.model';
import { CrossTabTable } from '../cross-tab/cross-tab';
import { LookupSelect } from '../../../shared/components/lookup-select/lookup-select';
import { LookupService } from '../../../shared/services/lookup.service';
import { exportFile } from '../../../shared/utils/download';
import { today } from '../../../shared/utils/date';
import { apiError } from '../../../shared/utils/api';

@Component({
  selector: 'app-monthly-sales-report',
  imports: [FormsModule, LookupSelect, CrossTabTable],
  templateUrl: './monthly-sales-report.html',
})
export class MonthlySalesReport {
  private service = inject(ReportService);
  lookup = inject(LookupService);
  halves = HALVES;

  year = signal(new Date().getFullYear());
  half = signal<'first' | 'last'>(new Date().getMonth() < 6 ? 'first' : 'last');
  sellerId = signal(0);            // 0 = all sellers

  data = signal<CrossTab | null>(null);
  loading = signal(false);
  error = signal<string | null>(null);
  exporting = signal(false);
  exportError = signal<string | null>(null);

  constructor() { this.load(); }

  private query(): MonthlySalesQuery {
    return { year: Number(this.year()), half: this.half(), sellerId: this.sellerId() };
  }

  load() {
    const y = Number(this.year());
    if (!y || y < 2000 || y > 2100) { this.error.set('السنة غير صحيحة'); return; }
    this.loading.set(true); this.error.set(null); this.exportError.set(null);
    this.service.monthlySales(this.query()).subscribe({
      next: d => { this.data.set(d); this.loading.set(false); },
      error: err => { this.error.set(apiError(err, 'فشل تحميل التقرير')); this.loading.set(false); },
    });
  }

  exportExcel() {
    exportFile(this.service.exportMonthlySales(this.query()), `monthly-sales-${this.year()}-${this.half()}-${today()}.xlsx`,
      { busy: this.exporting, error: this.exportError });
  }
}
