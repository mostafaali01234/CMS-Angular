// payroll-list/payroll-list.ts
import { Component, inject, signal } from '@angular/core';
import { DecimalPipe, DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { PayrollService } from '../payroll.service';
import { Payroll, PayrollFilter, statusLabel } from '../payroll.model';
import { LookupService } from '../../../shared/services/lookup.service';
import { ConfirmService } from '../../../shared/services/confirm.service';
import { Pager } from '../../../shared/components/pager/pager';
import { pagedList } from '../../../shared/utils/paged-list';
import { apiError } from '../../../shared/utils/api';

@Component({
  selector: 'app-payroll-list',
  imports: [RouterLink, FormsModule, DecimalPipe, DatePipe, Pager],
  templateUrl: './payroll-list.html',
})
export class PayrollList {
  private service = inject(PayrollService);
  private confirm = inject(ConfirmService);
  lookup = inject(LookupService);
  statusLabel = statusLabel;

  employees = signal<{ id: number; name: string }[]>([]);
  actionError = signal<string | null>(null);
  deletingId = signal<number | null>(null);

  list = pagedList<Payroll, PayrollFilter>(
    q => this.service.getPaged(q),
    () => ({ employeeId: 0, period: '', status: '' }),
    20,
    'فشل تحميل المرتبات',
  );

  constructor() {
    this.lookup.employees().subscribe(e => this.employees.set(e));
    this.list.reload();
  }

  async remove(p: Payroll) {
    const ok = await this.confirm.confirm({
      title: 'حذف مرتب', confirmText: 'حذف', danger: true,
      message: `حذف مرتب "${p.employee_name}" عن ${p.month}/${p.year}؟ ستعود العمولات الى حالة "مدفوعة".`,
    });
    if (!ok) return;
    this.actionError.set(null); this.deletingId.set(p.id);
    this.service.delete(p.id).subscribe({
      next: () => { this.deletingId.set(null); this.list.reload(); },
      error: err => { this.actionError.set(apiError(err, 'فشل الحذف')); this.deletingId.set(null); },
    });
  }
}