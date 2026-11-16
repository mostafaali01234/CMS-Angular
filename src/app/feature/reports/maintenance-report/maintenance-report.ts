// maintenance-report/maintenance-report.ts
import { Component, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReportService } from '../report.service';
import { DateQuery, MaintenanceReport } from '../report.model';
import { exportFile } from '../../../shared/utils/download';
import { today } from '../../../shared/utils/date';
import { apiError } from '../../../shared/utils/api';

@Component({
  selector: 'app-maintenance-report',
  imports: [FormsModule, DecimalPipe],
  templateUrl: './maintenance-report.html',
})
export class MaintenanceReportPage {
  private service = inject(ReportService);

  from = signal(today().slice(0, 4) + '-01-01');
  to = signal(today());
  data = signal<MaintenanceReport | null>(null);
  loading = signal(false);
  error = signal<string | null>(null);
  exporting = signal(false);
  exportError = signal<string | null>(null);

  constructor() { this.load(); }

  private query(): DateQuery { return { dateFrom: this.from(), dateTo: this.to() }; }

  load() {
    if (this.from() && this.to() && this.to() < this.from()) { this.error.set('تاريخ النهاية قبل البداية'); return; }
    this.loading.set(true); this.error.set(null); this.exportError.set(null);
    this.service.maintenance(this.query()).subscribe({
      next: d => { this.data.set(d); this.loading.set(false); },
      error: err => { this.error.set(apiError(err, 'فشل تحميل التقرير')); this.loading.set(false); },
    });
  }

  exportExcel() {
    exportFile(this.service.exportMaintenance(this.query()), `maintenance-${today()}.xlsx`,
      { busy: this.exporting, error: this.exportError });
  }

  thisMonth() { this.from.set(today().slice(0, 8) + '01'); this.to.set(today()); this.load(); }
  thisYear() { this.from.set(today().slice(0, 4) + '-01-01'); this.to.set(today()); this.load(); }
  allPeriods() { this.from.set(''); this.to.set(''); this.load(); }
}
