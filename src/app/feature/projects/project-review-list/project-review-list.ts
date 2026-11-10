// project-review-list/project-review-list.ts
import { Component, computed, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ProjectService } from '../project.service';
import { ReviewSummary } from '../project.model';
import { today } from '../../../shared/utils/date';
import { apiError } from '../../../shared/utils/api';

@Component({
  selector: 'app-project-review-list',
  imports: [RouterLink, FormsModule, DecimalPipe],
  templateUrl: './project-review-list.html',
})
export class ProjectReviewList {
  private service = inject(ProjectService);

  from = signal('');          // empty = all periods
  to = signal('');
  rows = signal<ReviewSummary[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);

  totals = computed(() => {
    const r = this.rows();
    const sum = (f: (x: ReviewSummary) => number) => r.reduce((a, x) => a + f(x), 0);
    const netSales = sum(x => x.net_sales);
    const profit = sum(x => x.profit);
    return {
      net_sales: netSales, net_purchases: sum(x => x.net_purchases), expenses: sum(x => x.expenses_total),
      total_cost: sum(x => x.total_cost), profit, margin: netSales === 0 ? 0 : (profit / netSales) * 100,
      loans: sum(x => x.loans_total), transfers: sum(x => x.transfers_total),
      shifts: sum(x => x.shifts_count), km: sum(x => x.km_total),
    };
  });

  constructor() { this.load(); }

  load() {
    if (this.from() && this.to() && this.to() < this.from()) { this.error.set('تاريخ النهاية قبل البداية'); return; }
    this.loading.set(true); this.error.set(null);
    this.service.summaries(this.from(), this.to()).subscribe({
      next: r => { this.rows.set(r); this.loading.set(false); },
      error: err => { this.error.set(apiError(err, 'فشل تحميل المشاريع')); this.loading.set(false); },
    });
  }

  thisMonth() { this.from.set(today().slice(0, 8) + '01'); this.to.set(today()); this.load(); }
  allPeriods() { this.from.set(''); this.to.set(''); this.load(); }

  query() { return { dateFrom: this.from() || null, dateTo: this.to() || null }; }
}