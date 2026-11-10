// project-review/project-review.ts
import { Component, computed, inject, signal } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ProjectService } from '../project.service';
import { invoiceTypeLabel, ProjectReviewData } from '../project.model';
import { exportFile } from '../../../shared/utils/download';
import { today } from '../../../shared/utils/date';
import { apiError } from '../../../shared/utils/api';

type Tab = 'sales' | 'purchases' | 'expenses' | 'loans' | 'transactions' | 'shifts';

@Component({
  selector: 'app-project-review',
  imports: [RouterLink, FormsModule, DatePipe, DecimalPipe],
  templateUrl: './project-review.html',
})
export class ProjectReview {
  private service = inject(ProjectService);
  private route = inject(ActivatedRoute);

  invoiceType = invoiceTypeLabel;
  projectId = Number(this.route.snapshot.paramMap.get('id'));

  from = signal(this.route.snapshot.queryParamMap.get('dateFrom') ?? '');
  to = signal(this.route.snapshot.queryParamMap.get('dateTo') ?? '');

  data = signal<ProjectReviewData | null>(null);
  loading = signal(false);
  error = signal<string | null>(null);
  exporting = signal(false);
  exportError = signal<string | null>(null);
  tab = signal<Tab>('sales');

  tabs = computed(() => {
    const d = this.data();
    return [
      { id: 'sales' as Tab, label: 'المبيعات', count: d?.sales.length ?? 0 },
      { id: 'purchases' as Tab, label: 'المشتريات', count: d?.purchases.length ?? 0 },
      { id: 'expenses' as Tab, label: 'المصروفات', count: d?.expenses.length ?? 0 },
      { id: 'loans' as Tab, label: 'السلف', count: d?.loans.length ?? 0 },
      { id: 'transactions' as Tab, label: 'التحويلات', count: d?.transactions.length ?? 0 },
      { id: 'shifts' as Tab, label: 'الورديات', count: d?.shifts.length ?? 0 },
    ];
  });

  constructor() { this.load(); }

  load() {
    if (this.from() && this.to() && this.to() < this.from()) { this.error.set('تاريخ النهاية قبل البداية'); return; }
    this.loading.set(true); this.error.set(null); this.exportError.set(null);
    this.service.review(this.projectId, this.from(), this.to()).subscribe({
      next: d => { this.data.set(d); this.loading.set(false); },
      error: err => { this.error.set(apiError(err, 'فشل تحميل المشروع')); this.loading.set(false); },
    });
  }

  allPeriods() { this.from.set(''); this.to.set(''); this.load(); }
  thisMonth() { this.from.set(today().slice(0, 8) + '01'); this.to.set(today()); this.load(); }

  sum<T>(rows: T[], f: (x: T) => number) { return rows.reduce((a, x) => a + f(x), 0); }

  exportExcel() {
    exportFile(this.service.exportReview(this.projectId, this.from(), this.to()),
      `project-${this.projectId}-${today()}.xlsx`,
      { busy: this.exporting, error: this.exportError });
  }
}