// employee-loan-list/employee-loan-list.ts
import { Component, ElementRef, inject, signal } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { EmployeeLoanService } from '../employee-loan.service';
import { LoanFilter, LoanListItem } from '../employee-loan.model';
import { ConfirmService } from '../../../shared/services/confirm.service';
import { LookupService } from '../../../shared/services/lookup.service';
import { LookupSelect } from '../../../shared/components/lookup-select/lookup-select';
import { Pager } from '../../../shared/components/pager/pager';
import { pagedList } from '../../../shared/utils/paged-list';
import { apiError } from '../../../shared/utils/api';

@Component({
  selector: 'app-employee-loan-list',
  imports: [RouterLink, FormsModule, DatePipe, DecimalPipe, LookupSelect, Pager],
  templateUrl: './employee-loan-list.html',
})
export class EmployeeLoanList {
  private service = inject(EmployeeLoanService);
  private confirm = inject(ConfirmService);
  private qp = inject(ActivatedRoute).snapshot.queryParamMap;
  lookup = inject(LookupService);

  // /employee-loans?employee=5 opens one employee's loans
  list = pagedList<LoanListItem, LoanFilter>(
    q => this.service.getPaged(q),
    () => ({ employeeId: Number(this.qp.get('employee')) || 0, mode: '', search: '', dateFrom: '', dateTo: '' }),
    20,
    'فشل تحميل السلف',
  );

  actionError = signal<string | null>(null);
  deletingId = signal<number | null>(null);

  constructor() { this.list.reload(); }

  // the server refuses these too; the buttons just say so up front
  canEdit = (l: LoanListItem) => l.deducted_count === 0 && l.skipped_count === 0;
  canDelete = (l: LoanListItem) => l.deducted_count === 0;

  async remove(l: LoanListItem) {
    const ok = await this.confirm.confirm({
      title: 'حذف سلفة',
      message: `هل أنت متأكد من حذف سلفة "${l.employee_name}" بمبلغ ${l.amount}؟ لا يمكن التراجع عن هذا الإجراء.`,
      confirmText: 'حذف',
      danger: true,
    });
    if (!ok) return;

    this.actionError.set(null);
    this.deletingId.set(l.id);
    this.service.delete(l.id).subscribe({
      next: () => { this.deletingId.set(null); this.list.reload(); },
      error: err => { this.actionError.set(apiError(err, 'فشل حذف السلفة')); this.deletingId.set(null); },
    });
  }
}