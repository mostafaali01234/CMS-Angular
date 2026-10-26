// customer-payment-form/customer-payment-form.ts
import { Component, computed, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Observable, Subscription } from 'rxjs';
import { CustomerPaymentService } from '../customer-payment.service';
import { SaleInvoiceService } from '../../sale-invoices/sale-invoice.service';
import { SaleInvoice } from '../../sale-invoices/sale-invoice.model';
import { OrderService } from '../../orders/order.service';
import { Order } from '../../orders/order.model';
import { ConfirmService } from '../../../shared/services/confirm.service';
import { LookupService } from '../../../shared/services/lookup.service';
import { activeOnly, CustomerOption, MoneySafeOption } from '../../../shared/models/lookup.model';
import { LookupSelect } from '../../../shared/components/lookup-select/lookup-select';
import { SearchSelect } from '../../../shared/components/search-select/search-select';
import { AuthService } from '../../../core/services/AuthService/auth'; 
import { apiError } from '../../../shared/utils/api';

const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

interface Alloc { amount: number; currency: number; }
type Mode = 'Regular_Payment' | 'Advance_Payment';

@Component({
  selector: 'app-customer-payment-form',
  imports: [FormsModule, RouterLink, DatePipe, DecimalPipe, LookupSelect, SearchSelect],
  templateUrl: './customer-payment-form.html',
})
export class CustomerPaymentForm implements OnInit, OnDestroy {
  private service = inject(CustomerPaymentService);
  private invoicesApi = inject(SaleInvoiceService);
  private orders = inject(OrderService);
  private confirm = inject(ConfirmService);
  private auth = inject(AuthService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  lookup = inject(LookupService);
  activeOnly = activeOnly;
  customerText = (c: CustomerOption) => (c.phone ? `${c.name} - ${c.phone}` : c.name);

  mode = signal<Mode>('Regular_Payment');
  customerId = signal(0);
  date = signal(new Date().toISOString().slice(0, 10));
  safeId = signal(0);
  amount = signal(0);
  amountCurrency = signal(0);
  notes = signal('');

  // order search
  orderInput = signal('');
  order = signal<Order | null>(null);
  orderLoading = signal(false);
  orderError = signal<string | null>(null);
  viewingAll = signal(true);       // false while only the order's invoices are listed

  safes = signal<MoneySafeOption[]>([]);
  invoices = signal<SaleInvoice[]>([]);
  invLoading = signal(false);
  invError = signal<string | null>(null);
  sel = signal<Record<number, Alloc>>({});

  saving = signal(false);
  error = signal<string | null>(null);

  private invSub?: Subscription;

  isAdvance = computed(() => this.mode() === 'Advance_Payment');
  isMulti = computed(() => this.safes().find(s => s.id === this.safeId())?.is_multi_currency ?? false);
  effectiveCurrency = computed(() => (this.isMulti() ? this.amountCurrency() : 0));
  hasCurrencyInvoices = computed(() => this.invoices().some(i => i.remaining_amount_currency > 0));

  selectedCount = computed(() => Object.keys(this.sel()).length);
  allocatedSum = computed(() => round2(Object.values(this.sel()).reduce((a, b) => a + b.amount, 0)));
  allocatedCurrency = computed(() => round2(Object.values(this.sel()).reduce((a, b) => a + b.currency, 0)));
  unallocated = computed(() => round2(this.amount() - this.allocatedSum()));
  unallocatedCurrency = computed(() => round2(this.effectiveCurrency() - this.allocatedCurrency()));
  overAllocated = computed(() => this.unallocated() < 0 || this.unallocatedCurrency() < 0);

  badAllocation = computed(() =>
    this.invoices().some(i => {
      const a = this.sel()[i.id];
      if (!a) return false;
      return a.amount < 0 || a.currency < 0 || a.amount > i.remaining_amount ||
        a.currency > i.remaining_amount_currency || (a.amount === 0 && a.currency === 0);
    }));

  canSubmit = computed(() => {
    const base = this.customerId() > 0 && this.safeId() > 0 &&
      (this.amount() > 0 || this.effectiveCurrency() > 0) && !this.saving();
    if (!base) return false;
    return this.isAdvance() ? !!this.order() : !this.overAllocated() && !this.badAllocation();
  });

  ngOnInit() {
    this.lookup.moneySafes().subscribe({ next: s => this.safes.set(s) });

    // opened from an invoice (?customer=3&invoice=12) or an order (?order=7)
    const qp = this.route.snapshot.queryParamMap;
    const order = Number(qp.get('order'));
    const customer = Number(qp.get('customer'));
    const invoice = Number(qp.get('invoice'));
    if (order > 0) { this.orderInput.set(String(order)); this.searchOrder(); }
    else if (customer > 0) this.onCustomer(customer, invoice > 0 ? invoice : undefined);
  }

  ngOnDestroy() { this.invSub?.unsubscribe(); }

  private resetInvoices() {
    this.invSub?.unsubscribe();
    this.invoices.set([]); this.sel.set({});
    this.invError.set(null); this.error.set(null); this.invLoading.set(false);
  }

  private loadInvoices(source: Observable<SaleInvoice[]>, after?: (list: SaleInvoice[]) => void) {
    this.resetInvoices();
    this.invLoading.set(true);
    this.invSub = source.subscribe({
      next: list => { this.invoices.set(list); this.invLoading.set(false); after?.(list); },
      error: err => { this.invError.set(apiError(err, 'فشل تحميل فواتير العميل')); this.invLoading.set(false); },
    });
  }

  /** a customer picked by hand */
  onCustomer(id: number, preselect?: number) {
    this.customerId.set(id);
    this.order.set(null);
    this.orderInput.set('');
    this.orderError.set(null);
    this.viewingAll.set(true);
    this.mode.set('Regular_Payment');
    this.resetInvoices();
    if (!id) return;

    this.loadInvoices(this.invoicesApi.getUnpaid(id), list => {
      const inv = preselect ? list.find(i => i.id === preselect) : undefined;
      if (inv) this.toggle(inv);
    });
  }

  /** search by order id: loads the order's customer and the invoices of that order */
  searchOrder() {
    const id = Math.trunc(+this.orderInput());
    if (!id) return;
    this.orderLoading.set(true);
    this.orderError.set(null);

    this.orders.getById(id).subscribe({
      next: o => {
        this.order.set(o);
        this.customerId.set(o.customer_id);
        this.viewingAll.set(false);
        this.orderLoading.set(false);
        this.loadInvoices(this.invoicesApi.getByOrder(id), list => {
          // no invoice yet: the only thing to record is an advance payment
          this.mode.set(list.length ? 'Regular_Payment' : 'Advance_Payment');
          const preselect = Number(this.route.snapshot.queryParamMap.get('invoice'));
          const inv = preselect ? list.find(i => i.id === preselect) : undefined;
          if (inv) this.toggle(inv);
        });
      },
      error: err => {
        this.order.set(null);
        this.orderError.set(apiError(err, 'الطلب غير موجود'));
        this.orderLoading.set(false);
      },
    });
  }

  showAllInvoices() {
    if (!this.customerId()) return;
    this.viewingAll.set(true);
    this.loadInvoices(this.invoicesApi.getUnpaid(this.customerId()));
  }

  setMode(m: Mode) {
    if (m === 'Advance_Payment' && !this.order()) return;
    this.mode.set(m);
    this.sel.set({});
  }

  toggle(inv: SaleInvoice) {
    const next = { ...this.sel() };
    if (inv.id in next) {
      delete next[inv.id];
    } else {
      if (this.amount() === 0 && this.amountCurrency() === 0) {
        this.amount.set(inv.remaining_amount);
        if (this.isMulti()) this.amountCurrency.set(inv.remaining_amount_currency);
      }
      const free = round2(this.amount() - this.allocatedSum());
      const freeCur = round2(this.effectiveCurrency() - this.allocatedCurrency());
      next[inv.id] = {
        amount: round2(Math.min(inv.remaining_amount, Math.max(free, 0))),
        currency: this.isMulti() ? round2(Math.min(inv.remaining_amount_currency, Math.max(freeCur, 0))) : 0,
      };
    }
    this.sel.set(next);
  }

  setAllocation(inv: SaleInvoice, field: keyof Alloc, value: number) {
    this.sel.update(s => ({ ...s, [inv.id]: { ...s[inv.id], [field]: round2(+value || 0) } }));
  }

  autoDistribute() {
    let left = this.amount();
    let leftCur = this.effectiveCurrency();
    const next: Record<number, Alloc> = {};
    for (const inv of this.invoices()) {
      const a = round2(Math.min(inv.remaining_amount, Math.max(left, 0)));
      const c = round2(Math.min(inv.remaining_amount_currency, Math.max(leftCur, 0)));
      if (a <= 0 && c <= 0) continue;
      next[inv.id] = { amount: a, currency: c };
      left = round2(left - a);
      leftCur = round2(leftCur - c);
      if (left <= 0 && leftCur <= 0) break;
    }
    this.sel.set(next);
  }

  async submit() {
    if (!this.canSubmit()) return;

    const auditorId = Number(this.auth.employeeId()) || 0;
    if (!auditorId) { this.error.set('تعذر تحديد الموظف الحالي، سجل الدخول مرة اخرى'); return; }

    this.saving.set(true);
    this.error.set(null);

    if (this.isAdvance()) {
      this.service.create({
        date: this.date(),
        type: 'Advance_Payment',
        customer_id: this.customerId(),
        invoice_id: null,
        advance_payment_order_id: this.order()!.id,
        money_safe_id: this.safeId(),
        amount: this.amount(),
        amount_currency: this.effectiveCurrency(),
        notes: this.notes(),
        auditor_id: auditorId,
      }).subscribe({
        next: () => this.router.navigate(['/customer-payments']),
        error: err => { this.error.set(apiError(err, 'فشل حفظ الدفعة')); this.saving.set(false); },
      });
      return;
    }

    const left = this.unallocated();
    const leftCur = this.unallocatedCurrency();
    if (left > 0 || leftCur > 0) {
      this.saving.set(false);
      const none = this.selectedCount() === 0;
      const part = [left > 0 ? `${left} جنيه` : '', leftCur > 0 ? `${leftCur} عملة` : ''].filter(Boolean).join(' و ');
      const ok = await this.confirm.confirm({
        title: none ? 'دفعة بدون فاتورة' : 'مبلغ غير موزع',
        message: none
          ? `لم تحدد اي فاتورة. سيتم اضافة المبلغ كاملا (${part}) الى رصيد العميل. هل تريد المتابعة؟`
          : `المبلغ المتبقي (${part}) بعد توزيعه على الفواتير سيضاف الى رصيد العميل. هل تريد المتابعة؟`,
        confirmText: 'متابعة',
        danger: false,
      });
      if (!ok) return;
      this.saving.set(true);
    }

    this.service.createAllocated({
      date: this.date(),
      customer_id: this.customerId(),
      money_safe_id: this.safeId(),
      amount: this.amount(),
      amount_currency: this.effectiveCurrency(),
      notes: this.notes(),
      auditor_id: auditorId,
      allocations: Object.entries(this.sel()).map(([id, a]) => ({
        invoice_id: +id, amount: a.amount, amount_currency: this.isMulti() ? a.currency : 0,
      })),
    }).subscribe({
      next: () => this.router.navigate(['/customer-payments']),
      error: err => { this.error.set(apiError(err, 'فشل حفظ الدفعة')); this.saving.set(false); },
    });
  }
}