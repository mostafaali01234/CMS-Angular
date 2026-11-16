// category-matrix-report/category-matrix-report.ts
// one screen for: orders / invoices  x  state / seller / tech  (rows)  x  product category (columns).
// The route data ({ source, rowBy }) picks the report.
import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ReportService } from '../report.service';
import {
  CrossTab, MatrixQuery, ORDER_KIND_MAINTENANCE, ORDER_KINDS_BASE, ReportRowBy, ReportSource,
} from '../report.model';
import { CrossTabTable } from '../cross-tab/cross-tab';
import { LookupSelect } from '../../../shared/components/lookup-select/lookup-select';
import { LookupService } from '../../../shared/services/lookup.service';
import { exportFile } from '../../../shared/utils/download';
import { today } from '../../../shared/utils/date';
import { apiError } from '../../../shared/utils/api';

const TITLES: Record<string, string> = {
  'orders-state': 'المبيعات بالمحافظات (اوردرات)',
  'invoices-state': 'المبيعات بالمحافظات (فواتير)',
  'orders-seller': 'مبيعات الموظفين (اوردرات)',
  'invoices-seller': 'مبيعات الموظفين (فواتير)',
  'orders-tech': 'تركيبات الفنيين (الاوردرات)',
  'invoices-tech': 'تركيبات الفنيين (الفواتير)',
};

@Component({
  selector: 'app-category-matrix-report',
  imports: [FormsModule, LookupSelect, CrossTabTable],
  templateUrl: './category-matrix-report.html',
})
export class CategoryMatrixReport {
  private service = inject(ReportService);
  private route = inject(ActivatedRoute);
  lookup = inject(LookupService);

  private cfg = this.route.snapshot.data as { source: ReportSource; rowBy: ReportRowBy };
  source = this.cfg.source;
  rowBy = this.cfg.rowBy;
  title = TITLES[`${this.source}-${this.rowBy}`] ?? 'تقرير';

  // the "maintenance only" choice exists for the techs' reports
  kinds = this.rowBy === 'tech' ? [...ORDER_KINDS_BASE, ORDER_KIND_MAINTENANCE] : ORDER_KINDS_BASE;

  from = signal(today().slice(0, 8) + '01');
  to = signal(today());
  kind = signal('');
  sellerId = signal(0);            // 0 = all sellers
  measure = signal<'count' | 'amount'>('count');
  includeCancelled = signal(false);

  data = signal<CrossTab | null>(null);
  loading = signal(false);
  error = signal<string | null>(null);
  exporting = signal(false);
  exportError = signal<string | null>(null);

  countLabel = this.source === 'orders' ? 'عدد الاوردرات' : 'عدد الفواتير';

  note = computed(() => {
    const what = this.source === 'orders' ? 'الاوردر' : 'الفاتورة';
    if (this.measure() === 'count') {
      return `كل ${what} يُحسب مرة واحدة تحت تصنيف اكبر منتج فيه (بالقيمة).`
        + (this.source === 'invoices' ? ' فواتير البيع فقط (بدون المرتجعات).' : '');
    }
    return 'قيمة كل منتج (بعد الخصم) تُحسب تحت تصنيفه.'
      + (this.source === 'invoices' ? ' مرتجعات البيع تُخصم، والاصناف المسعّرة بالعملة الاجنبية غير محسوبة.' : '');
  });

  constructor() { this.load(); }

  private query(): MatrixQuery {
    return {
      dateFrom: this.from(), dateTo: this.to(), kind: this.kind(), sellerId: this.sellerId(),
      measure: this.measure(), includeCancelled: this.source === 'orders' && this.includeCancelled(),
    };
  }

  load() {
    if (this.from() && this.to() && this.to() < this.from()) { this.error.set('تاريخ النهاية قبل البداية'); return; }
    this.loading.set(true); this.error.set(null); this.exportError.set(null);
    this.service.matrix(this.source, this.rowBy, this.query()).subscribe({
      next: d => { this.data.set(d); this.loading.set(false); },
      error: err => { this.error.set(apiError(err, 'فشل تحميل التقرير')); this.loading.set(false); },
    });
  }

  exportExcel() {
    exportFile(this.service.exportMatrix(this.source, this.rowBy, this.query()),
      `${this.source}-by-${this.rowBy}-${today()}.xlsx`, { busy: this.exporting, error: this.exportError });
  }

  thisMonth() { this.from.set(today().slice(0, 8) + '01'); this.to.set(today()); this.load(); }
  thisYear() { this.from.set(today().slice(0, 4) + '-01-01'); this.to.set(today()); this.load(); }
}
