// customer-payment-list/customer-payment-list.ts
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CustomerPaymentService } from '../customer-payment.service';
import { CustomerPayment, PAYMENT_TYPES, paymentLabel } from '../customer-payment.model';
import { ConfirmService } from '../../../shared/services/confirm.service';
import { LookupService } from '../../../shared/services/lookup.service';
import { SearchSelect } from '../../../shared/components/search-select/search-select';
import { CustomerOption } from '../../../shared/models/lookup.model';
import { apiError } from '../../../shared/utils/api';

const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

@Component({
  selector: 'app-customer-payment-list',
  imports: [RouterLink, FormsModule, DatePipe, DecimalPipe, SearchSelect],
  templateUrl: './customer-payment-list.html',
})
export class CustomerPaymentList implements OnInit {
  private service = inject(CustomerPaymentService);
  private confirm = inject(ConfirmService);
  lookup = inject(LookupService);

  types = PAYMENT_TYPES;
  typeLabel = paymentLabel;
  customerText = (c: CustomerOption) => (c.phone ? `${c.name} - ${c.phone}` : c.name);

  payments = signal<CustomerPayment[]>([]);
  search = signal('');
  orderSearch = signal('');
  dateFrom = signal('');
  dateTo = signal('');
  customerId = signal(0);
  typeFilter = signal('all');

  loading = signal(true);
  error = signal<string | null>(null);
  actionError = signal<string | null>(null);
  deletingId = signal<number | null>(null);

  filtered = computed(() => {
    const q = this.search().trim().toLowerCase();
    const ord = this.orderSearch().trim();
    const from = this.dateFrom();
    const to = this.dateTo();
    const cust = this.customerId();
    const type = this.typeFilter();

    return this.payments().filter(p => {
      const d = (p.date ?? '').slice(0, 10);
      if (from && d < from) return false;
      if (to && d > to) return false;
      if (cust && p.customer_id !== cust) return false;
      if (type !== 'all' && p.type !== type) return false;
      if (ord && String(p.invoice_order_id ?? p.advance_payment_order_id ?? '') !== ord) return false;
      if (!q) return true;
      return String(p.invoice_number ?? '') === q ||
        [p.customer_name, p.money_safe_name, p.notes].some(v => (v ?? '').toLowerCase().includes(q));
    });
  });

  // refunds go out, so they count negative
  private sign = (p: CustomerPayment) => (p.type === 'Refund_Payment' ? -1 : 1);
  totalAmount = computed(() => round2(this.filtered().reduce((s, p) => s + this.sign(p) * p.amount, 0)));
  totalCurrency = computed(() => round2(this.filtered().reduce((s, p) => s + this.sign(p) * p.amount_currency, 0)));

  ngOnInit() { this.load(); }

  load() {
    this.loading.set(true);
    this.error.set(null);
    this.service.getAll().subscribe({
      next: data => {
        this.payments.set([...data].sort((a, b) => b.date.localeCompare(a.date) || b.id - a.id));
        this.loading.set(false);
      },
      error: err => { this.error.set(apiError(err, 'فشل تحميل الدفعات')); this.loading.set(false); },
    });
  }

  clearFilters() {
    this.search.set(''); this.orderSearch.set(''); this.dateFrom.set(''); this.dateTo.set('');
    this.customerId.set(0); this.typeFilter.set('all');
  }

  async remove(p: CustomerPayment) {
    const ok = await this.confirm.confirm({
      title: 'حذف دفعة',
      message: `هل أنت متأكد من حذف ${this.typeLabel(p.type)} بمبلغ ${p.amount} للعميل "${p.customer_name}"؟`,
      confirmText: 'حذف',
      danger: true,
    });
    if (!ok) return;

    this.actionError.set(null);
    this.deletingId.set(p.id);
    this.service.delete(p.id).subscribe({
      next: () => { this.payments.update(l => l.filter(x => x.id !== p.id)); this.deletingId.set(null); },
      error: err => { this.actionError.set(apiError(err, 'فشل حذف الدفعة')); this.deletingId.set(null); },
    });
  }
}