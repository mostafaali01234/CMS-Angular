// money-safe-transaction-list/money-safe-transaction-list.ts
import { Component, computed, inject, signal } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MoneySafeTransactionService } from '../money-safe-transaction.service';
import {
  MoneySafeTransaction, MoneySafeTransactionFilter, MoneySafeTransactionSummary, TRANSACTION_TYPES,
} from '../money-safe-transaction.model';
import { ConfirmService } from '../../../shared/services/confirm.service';
import { LookupService } from '../../../shared/services/lookup.service';
import { LookupSelect } from '../../../shared/components/lookup-select/lookup-select';
import { Pager } from '../../../shared/components/pager/pager';
import { pagedList } from '../../../shared/utils/paged-list';
import { today } from '../../../shared/utils/date';
import { apiError } from '../../../shared/utils/api';

@Component({
  selector: 'app-money-safe-transaction-list',
  imports: [RouterLink, FormsModule, DatePipe, DecimalPipe, LookupSelect, Pager],
  templateUrl: './money-safe-transaction-list.html',
})
export class MoneySafeTransactionList {
  private service = inject(MoneySafeTransactionService);
  private confirm = inject(ConfirmService);
  lookup = inject(LookupService);

  types = TRANSACTION_TYPES;

  // the date fields start as today, so the page opens on today's transactions
  list = pagedList<MoneySafeTransaction, MoneySafeTransactionFilter, MoneySafeTransactionSummary>(
    q => this.service.getPaged(q),
    () => ({ dateFrom: today(), dateTo: today(), moneySafeId: 0, transactionType: '', projectId: 0, search: '' }),
    20,
    'فشل تحميل الحركات',
  );

  showingToday = computed(() => {
    const a = this.list.applied();
    return a.dateFrom === today() && a.dateTo === today();
  });

  actionError = signal<string | null>(null);
  deletingId = signal<number | null>(null);

  constructor() { this.list.reload(); }

  async remove(t: MoneySafeTransaction) {
    const ok = await this.confirm.confirm({
      title: 'حذف حركة',
      message: `هل أنت متأكد من حذف حركة ${t.transaction_amount} من "${t.out_money_safe_name}" الى "${t.in_money_safe_name}"؟ سيتغير رصيد الخزينتين. لا يمكن التراجع عن هذا الإجراء.`,
      confirmText: 'حذف',
      danger: true,
    });
    if (!ok) return;

    this.actionError.set(null);
    this.deletingId.set(t.id);
    this.service.delete(t.id).subscribe({
      next: () => { this.deletingId.set(null); this.list.reload(); },
      error: err => { this.actionError.set(apiError(err, 'فشل حذف الحركة')); this.deletingId.set(null); },
    });
  }
}