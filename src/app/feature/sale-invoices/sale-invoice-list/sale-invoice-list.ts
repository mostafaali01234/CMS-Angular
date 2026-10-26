// sale-invoice-list/sale-invoice-list.ts
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { SaleInvoiceService } from '../sale-invoice.service';
import { SaleInvoice, saleTypeLabel } from '../sale-invoice.model';
import { ConfirmService } from '../../../shared/services/confirm.service';
import { LookupService } from '../../../shared/services/lookup.service';
import { SearchSelect } from '../../../shared/components/search-select/search-select';
import { CustomerOption } from '../../../shared/models/lookup.model';
import { AuthService } from '../../../core/services/AuthService/auth'; 
import { apiError } from '../../../shared/utils/api';

type PayFilter = 'all' | 'unpaid' | 'paid';
const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

@Component({
  selector: 'app-sale-invoice-list',
  imports: [RouterLink, FormsModule, DatePipe, DecimalPipe, SearchSelect],
  templateUrl: './sale-invoice-list.html',
})
export class SaleInvoiceList implements OnInit {
  private service = inject(SaleInvoiceService);
  private confirm = inject(ConfirmService);
  private auth = inject(AuthService);
  lookup = inject(LookupService);

  isSuper = this.auth.hasRole('SuperAdmin');
  typeLabel = saleTypeLabel;
  customerText = (c: CustomerOption) => (c.phone ? `${c.name} - ${c.phone}` : c.name);

  invoices = signal<SaleInvoice[]>([]);
  search = signal('');
  orderSearch = signal('');
  dateFrom = signal('');
  dateTo = signal('');
  customerId = signal(0);
  typeFilter = signal('Sale');
  payFilter = signal<PayFilter>('all');

  loading = signal(true);
  error = signal<string | null>(null);
  actionError = signal<string | null>(null);
  deletingId = signal<number | null>(null);

  private sign = (i: SaleInvoice) => (i.type === 'Sale_Return' ? -1 : 1);
  private unpaid = (i: SaleInvoice) =>
    i.type === 'Sale' && (i.remaining_amount > 0 || i.remaining_amount_currency > 0);

  filtered = computed(() => {
    const q = this.search().trim().toLowerCase();
    const ord = this.orderSearch().trim();
    const from = this.dateFrom();
    const to = this.dateTo();
    const cust = this.customerId();
    const type = this.typeFilter();
    const pay = this.payFilter();

    return this.invoices().filter(i => {
      const d = (i.date ?? '').slice(0, 10);
      if (from && d < from) return false;
      if (to && d > to) return false;
      if (cust && i.customer_id !== cust) return false;
      if (type !== 'all' && i.type !== type) return false;
      if (ord && String(i.order_id ?? '') !== ord) return false;
      if (pay === 'unpaid' && !this.unpaid(i)) return false;
      if (pay === 'paid' && !(i.type === 'Sale' && !this.unpaid(i))) return false;
      if (!q) return true;
      return String(i.number) === q ||
        [i.customer_name, i.notes].some(v => (v ?? '').toLowerCase().includes(q));
    });
  });

  totalNet = computed(() => round2(this.filtered().reduce((s, i) => s + this.sign(i) * i.net_total, 0)));
  totalNetCurrency = computed(() => round2(this.filtered().reduce((s, i) => s + this.sign(i) * i.net_total_currency, 0)));
  totalPaid = computed(() => round2(this.filtered().reduce((s, i) => s + i.paid_amount, 0)));
  totalRemaining = computed(() => round2(this.filtered().reduce((s, i) => s + i.remaining_amount, 0)));
  totalRemainingCurrency = computed(() => round2(this.filtered().reduce((s, i) => s + i.remaining_amount_currency, 0)));

  ngOnInit() { this.load(); }

  load() {
    this.loading.set(true);
    this.error.set(null);
    this.service.getAll().subscribe({
      next: data => {
        this.invoices.set([...data].sort((a, b) => b.date.localeCompare(a.date) || b.id - a.id));
        this.loading.set(false);
      },
      error: err => { this.error.set(apiError(err, 'فشل تحميل الفواتير')); this.loading.set(false); },
    });
  }

  clearFilters() {
    this.search.set(''); this.orderSearch.set(''); this.dateFrom.set(''); this.dateTo.set('');
    this.customerId.set(0); this.typeFilter.set('all'); this.payFilter.set('all');
  }

  editLink(i: SaleInvoice) {
    return i.type === 'Sale_Return'
      ? ['/sale-invoices', 'returns', i.id, 'edit']
      : ['/sale-invoices', i.id, 'edit'];
  }

  hasLinks = (i: SaleInvoice) => i.paid_amount > 0 || i.returned_amount > 0 || i.refunded_amount > 0;
  // only SuperAdmin can open an invoice with payments or returns for editing
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
      next: () => { this.load(); this.deletingId.set(null); },   // reload: linked returns disappear too
      error: err => { this.actionError.set(apiError(err, 'فشل حذف الفاتورة')); this.deletingId.set(null); },
    });
  }
}