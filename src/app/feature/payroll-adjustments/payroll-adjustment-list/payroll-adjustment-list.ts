// payroll-adjustment-list/payroll-adjustment-list.ts
import { Component, inject, signal } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { PayrollAdjustmentService } from '../payroll-adjustment.service';
import { ADJUSTMENT_TYPES, AdjustmentFilter, AdjustmentListItem, AdjustmentSummary, ALL_TYPES, typeLabel } from '../payroll-adjustment.model';
import { ConfirmService } from '../../../shared/services/confirm.service';
import { LookupService } from '../../../shared/services/lookup.service';
import { LookupSelect } from '../../../shared/components/lookup-select/lookup-select';
import { Pager } from '../../../shared/components/pager/pager';
import { pagedList } from '../../../shared/utils/paged-list';
import { apiError } from '../../../shared/utils/api';

@Component({
  selector: 'app-payroll-adjustment-list',
  imports: [RouterLink, FormsModule, DatePipe, DecimalPipe, LookupSelect, Pager],
  templateUrl: './payroll-adjustment-list.html',
})
export class PayrollAdjustmentList {
  private service = inject(PayrollAdjustmentService);
  private confirm = inject(ConfirmService);
  private qp = inject(ActivatedRoute).snapshot.queryParamMap;
  lookup = inject(LookupService);

  types = ALL_TYPES;
  typeLabel = typeLabel;

  // /payroll-adjustments?employee=5 opens one employee's adjustments
  list = pagedList<AdjustmentListItem, AdjustmentFilter, AdjustmentSummary>(
    q => this.service.getPaged(q),
    () => ({ employeeId: Number(this.qp.get('employee')) || 0, kind: '', type: '', search: '', dateFrom: '', dateTo: '' }),
    20,
    'فشل تحميل الخصومات والحوافز',
  );

  actionError = signal<string | null>(null);
  deletingId = signal<number | null>(null);

  constructor() { this.list.reload(); }

  async remove(a: AdjustmentListItem) {
    const ok = await this.confirm.confirm({
      title: a.kind === 1 ? 'حذف حافز' : 'حذف خصم',
      message: `هل أنت متأكد من حذف ${typeLabel(a.type)} بمبلغ ${a.amount} للموظف "${a.employee_name}"؟ لا يمكن التراجع عن هذا الإجراء.`,
      confirmText: 'حذف',
      danger: true,
    });
    if (!ok) return;

    this.actionError.set(null);
    this.deletingId.set(a.id);
    this.service.delete(a.id).subscribe({
      next: () => { this.deletingId.set(null); this.list.reload(); },
      error: err => { this.actionError.set(apiError(err, 'فشل الحذف')); this.deletingId.set(null); },
    });
  }
}