// expense-list/expense-list.ts
import { Component, computed, inject, signal } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ExpenseService } from '../expense.service';
import { Expense, ExpenseFilter, ExpenseSummary } from '../expense.model';
import { ConfirmService } from '../../../shared/services/confirm.service';
import { LookupService } from '../../../shared/services/lookup.service';
import { ExpenseTypeOption } from '../../../shared/models/lookup.model';
import { Pager } from '../../../shared/components/pager/pager';
import { pagedList } from '../../../shared/utils/paged-list';
import { apiError } from '../../../shared/utils/api';
import { ExpenseCategoryTypeSelect } from '../../../shared/components/expense-category-type-select/expense-category-type-select';
import { today } from '../../../shared/utils/date';


@Component({
  selector: 'app-expense-list',
  imports: [RouterLink, FormsModule, DatePipe, DecimalPipe, ExpenseCategoryTypeSelect, Pager],  
  templateUrl: './expense-list.html',
})
export class ExpenseList {
  private service = inject(ExpenseService);
  private confirm = inject(ConfirmService);
  lookup = inject(LookupService);

  list = pagedList<Expense, ExpenseFilter, ExpenseSummary>(
    q => this.service.getPaged(q),
    () => ({ dateFrom: today(), dateTo: today(), categoryId: 0, expenseTypeId: 0, search: '' }),
    20,
    'فشل تحميل المصروفات',
  );

  // a new function whenever the category changes, so the type dropdown re-filters
  typeFilter = computed(() => {
    const cat = this.list.form().categoryId;
    return (t: ExpenseTypeOption) => !cat || t.category_id === cat;
  });

  showingToday = computed(() => {
    const a = this.list.applied();
    return a.dateFrom === today() && a.dateTo === today();
  });

  actionError = signal<string | null>(null);
  deletingId = signal<number | null>(null);

  constructor() { this.list.reload(); }

  onCategory(id: number) {
    this.list.patch({ categoryId: id, expenseTypeId: 0 }, true);
  }

  async remove(e: Expense) {
    const ok = await this.confirm.confirm({
      title: 'حذف مصروف',
      message: `هل أنت متأكد من حذف مصروف "${e.expense_type_name}" بمبلغ ${e.amount}؟ لا يمكن التراجع عن هذا الإجراء.`,
      confirmText: 'حذف',
      danger: true,
    });
    if (!ok) return;

    this.actionError.set(null);
    this.deletingId.set(e.id);
    this.service.delete(e.id).subscribe({
      next: () => { this.deletingId.set(null); this.list.reload(); },
      error: err => { this.actionError.set(apiError(err, 'فشل حذف المصروف')); this.deletingId.set(null); },
    });
  }
}