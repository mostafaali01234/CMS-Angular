// buy-invoice-list/buy-invoice-list.ts
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { BuyInvoiceService } from '../buy-invoice.service';
import { BuyInvoice, typeLabel } from '../buy-invoice.model';
import { ConfirmService } from '../../../shared/services/confirm.service';
import { LookupService } from '../../../shared/services/lookup.service';
import { LookupSelect } from '../../../shared/components/lookup-select/lookup-select';
import { apiError } from '../../../shared/utils/api';
import { AuthService } from '../../../core/services/AuthService/auth';

type PayFilter = 'all' | 'unpaid' | 'paid';

const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

@Component({
  selector: 'app-buy-invoice-list',
  imports: [RouterLink, FormsModule, DatePipe, DecimalPipe, LookupSelect],
  templateUrl: './buy-invoice-list.html',
})
export class BuyInvoiceList implements OnInit {
  private service = inject(BuyInvoiceService);
  private confirm = inject(ConfirmService);
  lookup = inject(LookupService);

  private auth = inject(AuthService);
  isSuper = this.auth.hasRole('SuperAdmin');


  typeLabel = typeLabel;

  invoices = signal<BuyInvoice[]>([]);
  search = signal('');
  dateFrom = signal('');
  dateTo = signal('');
  supplierId = signal(0);
  typeFilter = signal('Buy');
  payFilter = signal<PayFilter>('all');

  loading = signal(true);
  error = signal<string | null>(null);
  actionError = signal<string | null>(null);
  deletingId = signal<number | null>(null);

  filtered = computed(() => {
    const q = this.search().trim().toLowerCase();
    const from = this.dateFrom();
    const to = this.dateTo();
    const sup = this.supplierId();
    const type = this.typeFilter();
    const pay = this.payFilter();
    const unpaid = (i: BuyInvoice) => i.type === 'Buy' && (i.remaining_amount > 0 || i.remaining_amount_currency > 0);


    return this.invoices().filter(i => {
      const d = (i.date ?? '').slice(0, 10);
      if (from && d < from) return false;
      if (to && d > to) return false;
      if (sup && i.supplier_id !== sup) return false;
      if (type !== 'all' && i.type !== type) return false;
      // returns are neither paid nor unpaid
      if (pay === 'unpaid' && !unpaid(i)) return false;
      if (pay === 'paid' && !(i.type === 'Buy' && !unpaid(i))) return false;
      if (!q) return true;
      return String(i.number) === q ||
        [i.supplier_name, i.notes].some(v => (v ?? '').toLowerCase().includes(q));
    });
  });

  // returns count as negative
  private sign = (i: BuyInvoice) => (i.type === 'Buy_Return' ? -1 : 1);

  totalNet = computed(() =>
    round2(this.filtered().reduce((s, i) => s + this.sign(i) * i.net_total, 0)));
  totalPaid = computed(() =>
    round2(this.filtered().reduce((s, i) => s + i.paid_amount, 0)));
  totalRemaining = computed(() =>
    round2(this.filtered().reduce((s, i) => s + i.remaining_amount, 0)));
  totalNetCurrency = computed(() =>
    round2(this.filtered().reduce((s, i) => s + this.sign(i) * i.net_total_currency, 0)));
  totalPaidCurrency = computed(() =>
    round2(this.filtered().reduce((s, i) => s + i.paid_amount_currency, 0)));
  totalRemainingCurrency = computed(() =>
    round2(this.filtered().reduce((s, i) => s + i.remaining_amount_currency, 0)));

  ngOnInit() { this.load(); }

  load() {
    this.loading.set(true);
    this.error.set(null);
    this.service.getAll().subscribe({
      next: data => {
        this.invoices.set([...data].sort((a, b) => b.date.localeCompare(a.date) || b.id - a.id));
        this.loading.set(false);
      },
      error: err => {
        this.error.set(apiError(err, 'فشل تحميل الفواتير'));
        this.loading.set(false);
      },
    });
  }

  clearFilters() {
    this.search.set('');
    this.dateFrom.set('');
    this.dateTo.set('');
    this.supplierId.set(0);
    this.typeFilter.set('all');
    this.payFilter.set('all');
  }

  editLink(i: BuyInvoice) {
    return i.type === 'Buy_Return'
      ? ['/buy-invoices', 'returns', i.id, 'edit']
      : ['/buy-invoices', i.id, 'edit'];
  }

  // an invoice with payments or returns can only be viewed
  locks = (i: BuyInvoice) => !this.isSuper && (i.paid_amount > 0 || i.returned_amount > 0);
  hasLinks = (i: BuyInvoice) => i.paid_amount > 0 || i.returned_amount > 0;

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
      next: () => {
        this.invoices.update(list => list.filter(x => x.id !== i.id));
        this.deletingId.set(null);
      },
      error: err => {
        this.actionError.set(apiError(err, 'فشل حذف الفاتورة'));
        this.deletingId.set(null);
      },
    });
  }
}