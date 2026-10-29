// sale-invoice-list/sale-invoice-list.ts
import { Component, computed, inject, signal } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { SaleInvoiceService } from '../sale-invoice.service';
import { SaleInvoice, SaleInvoiceFilter, saleTypeLabel } from '../sale-invoice.model';
import { InvoiceListSummary } from '../../../shared/models/paged.model';
import { ConfirmService } from '../../../shared/services/confirm.service';
import { LookupService } from '../../../shared/services/lookup.service';
import { SearchSelect } from '../../../shared/components/search-select/search-select';
import { Pager } from '../../../shared/components/pager/pager';
import { CustomerOption } from '../../../shared/models/lookup.model';
import { AuthService } from '../../../core/services/AuthService/auth';
import { pagedList } from '../../../shared/utils/paged-list';
import { today } from '../../../shared/utils/date';
import { blobError, saveBlob } from '../../../shared/utils/download';
import { apiError } from '../../../shared/utils/api';

@Component({
  selector: 'app-sale-invoice-list',
  imports: [RouterLink, FormsModule, DatePipe, DecimalPipe, SearchSelect, Pager],
  templateUrl: './sale-invoice-list.html',
})
export class SaleInvoiceList {
  private service = inject(SaleInvoiceService);
  private confirm = inject(ConfirmService);
  private auth = inject(AuthService);
  lookup = inject(LookupService);

  isSuper = this.auth.hasRole('SuperAdmin');
  typeLabel = saleTypeLabel;
  customerText = (c: CustomerOption) => (c.phone ? `${c.name} - ${c.phone}` : c.name);

  list = pagedList<SaleInvoice, SaleInvoiceFilter, InvoiceListSummary>(
    q => this.service.getPaged(q),
    () => ({ dateFrom: today(), dateTo: today(), customerId: 0, type: 'Sale', payStatus: '', search: '', number: '', orderId: '' }),
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

  editLink(i: SaleInvoice) {
    return i.type === 'Sale_Return'
      ? ['/sale-invoices', 'returns', i.id, 'edit']
      : ['/sale-invoices', i.id, 'edit'];
  }

  hasLinks = (i: SaleInvoice) => i.paid_amount > 0 || i.returned_amount > 0 || i.refunded_amount > 0;
  locks = (i: SaleInvoice) => !this.isSuper && this.hasLinks(i);

  async remove(i: SaleInvoice) {
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
      next: () => { this.deletingId.set(null); this.list.reload(); },
      error: err => { this.actionError.set(apiError(err, 'فشل حذف الفاتورة')); this.deletingId.set(null); },
    });
  }

  exportExcel(i: SaleInvoice) {
    this.exportingId.set(i.id);
    this.actionError.set(null);
    this.service.exportExcel(i.id).subscribe({
      next: blob => { saveBlob(blob, `sale-invoice-${i.number}.xlsx`); this.exportingId.set(null); },
      error: async err => { this.actionError.set(await blobError(err, 'فشل تصدير الفاتورة')); this.exportingId.set(null); },
    });
  }
}