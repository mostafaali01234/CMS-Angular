// employee-list/employee-list.ts
import { Component, inject, signal } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { EmployeeService } from '../employee.service';
import { EmployeeFilter, EmployeeListItem } from '../employee.model';
import { ConfirmService } from '../../../shared/services/confirm.service';
import { LookupService } from '../../../shared/services/lookup.service';
import { LookupSelect } from '../../../shared/components/lookup-select/lookup-select';
import { Pager } from '../../../shared/components/pager/pager';
import { pagedList } from '../../../shared/utils/paged-list';
import { apiError } from '../../../shared/utils/api';

@Component({
  selector: 'app-employee-list',
  imports: [RouterLink, FormsModule, DatePipe, DecimalPipe, LookupSelect, Pager],
  templateUrl: './employee-list.html',
})
export class EmployeeList {
  private service = inject(EmployeeService);
  private confirm = inject(ConfirmService);
  lookup = inject(LookupService);

  list = pagedList<EmployeeListItem, EmployeeFilter>(
    q => this.service.getPaged(q),
    () => ({ search: '', departmentId: 0, jobId: 0, active: '' }),
    20,
    'فشل تحميل الموظفين',
  );

  actionError = signal<string | null>(null);
  deletingId = signal<number | null>(null);

  constructor() { this.list.reload(); }

  async remove(e: EmployeeListItem) {
    const ok = await this.confirm.confirm({
      title: 'حذف موظف',
      message: `هل أنت متأكد من حذف الموظف "${e.name}"؟ لا يمكن التراجع عن هذا الإجراء.`,
      confirmText: 'حذف',
      danger: true,
    });
    if (!ok) return;

    this.actionError.set(null);
    this.deletingId.set(e.id);
    this.service.delete(e.id).subscribe({
      next: () => { this.deletingId.set(null); this.list.reload(); },
      error: err => { this.actionError.set(apiError(err, 'فشل حذف الموظف')); this.deletingId.set(null); },
    });
  }
}