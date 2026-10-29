// buy-invoice-list/buy-invoice-list.ts
import { Component, computed, inject } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { signal } from '@angular/core';
import { BuyInvoiceService } from '../buy-invoice.service';
import { BuyInvoice, BuyInvoiceFilter, typeLabel } from '../buy-invoice.model';
import { InvoiceListSummary } from '../../../shared/models/paged.model';
import { ConfirmService } from '../../../shared/services/confirm.service';
import { LookupService } from '../../../shared/services/lookup.service';
import { LookupSelect } from '../../../shared/components/lookup-select/lookup-select';
import { Pager } from '../../../shared/components/pager/pager';
import { AuthService } from '../../../core/services/AuthService/auth';
import { pagedList } from '../../../shared/utils/paged-list';
import { today } from '../../../shared/utils/date';
import { blobError, saveBlob } from '../../../shared/utils/download';
import { apiError } from '../../../shared/utils/api';

@Component({
  selector: 'app-buy-invoice-list',
  imports: [RouterLink, FormsModule, DatePipe, DecimalPipe, LookupSelect, Pager],
  templateUrl: './buy-invoice-list.html',
})
export class BuyInvoiceList {
  private service = inject(BuyInvoiceService);
  private confirm = inject(ConfirmService);
  private auth = inject(AuthService);
  lookup = inject(LookupService);

  isSuper = this.auth.hasRole('SuperAdmin');
  typeLabel = typeLabel;

  // the date fields start as today, so the page opens on today's invoices
  list = pagedList<BuyInvoice, BuyInvoiceFilter, InvoiceListSummary>(
    q => this.service.getPaged(q),
    () => ({ dateFrom: today(), dateTo: today(), supplierId: 0, type: 'Buy', payStatus: '', search: '', number: '' }),
    20,
    'فشل تحميل الفواتير',
  );

  showingToday = computed(() => {
    const a = this.list.applied();
    return a.dateFrom === today() && a.dateTo === today();
  });

  actionError = signal<string | null>(null);
  deletingId = signal<number | null>(null);
  exportingId = signal<number | null>(null);

  constructor() { this.list.reload(); }

  editLink(i: BuyInvoice) {
    return i.type === 'Buy_Return'
      ? ['/buy-invoices', 'returns', i.id, 'edit']
      : ['/buy-invoices', i.id, 'edit'];
  }

  hasLinks = (i: BuyInvoice) => i.paid_amount > 0 || i.returned_amount > 0;
  // only SuperAdmin can open an invoice with payments or returns for editing
  locks = (i: BuyInvoice) => !this.isSuper && this.hasLinks(i);

  async remove(i: BuyInvoice) {
    const ok = await this.confirm.confirm({
      title: 'حذف فاتورة',
      message: `هل أنت متأكد من حذف الفاتورة رقم ${i.number}؟` +
        (this.hasLinks(i) ? ' سيتم حذف الدفعات والمرتجعات المرتبطة بها ايضا.' : '') +
        ' لا يمكن التراجع عن هذا الإجراء.',
      confirmText: 'حذف',
      danger: true,
    });
    if (!ok) return;

    this.actionError.set(null);
    this.deletingId.set(i.id);
    this.service.delete(i.id).subscribe({
      next: () => { this.deletingId.set(null); this.list.reload(); },   // totals and pages are the server's
      error: err => { this.actionError.set(apiError(err, 'فشل حذف الفاتورة')); this.deletingId.set(null); },
    });
  }

  exportExcel(i: BuyInvoice) {
    this.exportingId.set(i.id);
    this.actionError.set(null);
    this.service.exportExcel(i.id).subscribe({
      next: blob => { saveBlob(blob, `buy-invoice-${i.number}.xlsx`); this.exportingId.set(null); },
      error: async err => { this.actionError.set(await blobError(err, 'فشل تصدير الفاتورة')); this.exportingId.set(null); },
    });
  }
}