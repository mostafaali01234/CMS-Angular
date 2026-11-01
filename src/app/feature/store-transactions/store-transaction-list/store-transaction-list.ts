// store-transaction-list/store-transaction-list.ts
import { Component, computed, inject, signal } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { StoreTransactionService } from '../store-transaction.service';
import { StoreTransaction, StoreTransactionFilter } from '../store-transaction.model';
import { ConfirmService } from '../../../shared/services/confirm.service';
import { LookupService } from '../../../shared/services/lookup.service';
import { ProductOption } from '../../../shared/models/lookup.model';
import { LookupSelect } from '../../../shared/components/lookup-select/lookup-select';
import { SearchSelect } from '../../../shared/components/search-select/search-select';
import { Pager } from '../../../shared/components/pager/pager';
import { pagedList } from '../../../shared/utils/paged-list';
import { today } from '../../../shared/utils/date';
import { apiError } from '../../../shared/utils/api';

@Component({
  selector: 'app-store-transaction-list',
  imports: [RouterLink, FormsModule, DatePipe, DecimalPipe, LookupSelect, SearchSelect, Pager],
  templateUrl: './store-transaction-list.html',
})
export class StoreTransactionList {
  private service = inject(StoreTransactionService);
  private confirm = inject(ConfirmService);
  lookup = inject(LookupService);

  productText = (p: ProductOption) => (p.barcode ? `${p.name} - ${p.barcode}` : p.name);

  // the date fields start as today, so the page opens on today's transactions
  list = pagedList<StoreTransaction, StoreTransactionFilter>(
    q => this.service.getPaged(q),
    () => ({ dateFrom: today(), dateTo: today(), outStoreId: 0, inStoreId: 0, productId: 0, search: '' }),
    20,
    'فشل تحميل الحركات',
  );

  showingToday = computed(() => {
    const a = this.list.applied();
    return a.dateFrom === today() && a.dateTo === today();
  });

  expandedId = signal<number | null>(null);
  actionError = signal<string | null>(null);
  deletingId = signal<number | null>(null);

  constructor() { this.list.reload(); }

  toggle(t: StoreTransaction) {
    this.expandedId.update(id => (id === t.id ? null : t.id));
  }

  async remove(t: StoreTransaction) {
    const ok = await this.confirm.confirm({
      title: 'حذف حركة مخزن',
      message: `هل أنت متأكد من حذف الحركة رقم ${t.id} من "${t.out_store_name}" الى "${t.in_store_name}"؟ لا يمكن التراجع عن هذا الإجراء.`,
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