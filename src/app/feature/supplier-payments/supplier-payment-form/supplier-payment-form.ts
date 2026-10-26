// supplier-payment-form/supplier-payment-form.ts
import { Component, computed, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { SupplierPaymentService } from '../supplier-payment.service';
import { BuyInvoiceService } from '../../buy-invoices/buy-invoice.service';
import { BuyInvoice } from '../../buy-invoices/buy-invoice.model';
import { ConfirmService } from '../../../shared/services/confirm.service';
import { LookupService } from '../../../shared/services/lookup.service';
import { activeOnly, MoneySafeOption, SupplierOption } from '../../../shared/models/lookup.model';
import { LookupSelect } from '../../../shared/components/lookup-select/lookup-select';
import { SearchSelect } from '../../../shared/components/search-select/search-select';
import { AuthService } from '../../../core/services/AuthService/auth'; 
import { apiError } from '../../../shared/utils/api';

const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

interface Alloc { amount: number; currency: number; }

@Component({
  selector: 'app-supplier-payment-form',
  imports: [FormsModule, RouterLink, DatePipe, DecimalPipe, LookupSelect, SearchSelect],
  templateUrl: './supplier-payment-form.html',
})
export class SupplierPaymentForm implements OnInit, OnDestroy {
  private service = inject(SupplierPaymentService);
  private invoicesApi = inject(BuyInvoiceService);
  private confirm = inject(ConfirmService);
  private auth = inject(AuthService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  lookup = inject(LookupService);
  activeOnly = activeOnly;
  supplierText = (s: SupplierOption) => (s.phone ? `${s.name} - ${s.phone}` : s.name);

  supplierId = signal(0);
  date = signal(new Date().toISOString().slice(0, 10));
  safeId = signal(0);
  amount = signal(0);
  amountCurrency = signal(0);
  notes = signal('');

  safes = signal<MoneySafeOption[]>([]);
  invoices = signal<BuyInvoice[]>([]);
  invLoading = signal(false);
  invError = signal<string | null>(null);

  // invoice id -> what is paid to it, in pounds and in currency
  sel = signal<Record<number, Alloc>>({});

  saving = signal(false);
  error = signal<string | null>(null);

  private invSub?: Subscription;

  isMulti = computed(() => this.safes().find(s => s.id === this.safeId())?.is_multi_currency ?? false);
  hasCurrencyInvoices = computed(() => this.invoices().some(i => i.remaining_amount_currency > 0));

  selectedCount = computed(() => Object.keys(this.sel()).length);
  allocatedSum = computed(() => round2(Object.values(this.sel()).reduce((a, b) => a + b.amount, 0)));
  allocatedCurrency = computed(() => round2(Object.values(this.sel()).reduce((a, b) => a + b.currency, 0)));

  // a currency amount only counts when the safe takes currency
  effectiveCurrency = computed(() => (this.isMulti() ? this.amountCurrency() : 0));
  unallocated = computed(() => round2(this.amount() - this.allocatedSum()));
  unallocatedCurrency = computed(() => round2(this.effectiveCurrency() - this.allocatedCurrency()));
  overAllocated = computed(() => this.unallocated() < 0 || this.unallocatedCurrency() < 0);

  badAllocation = computed(() =>
    this.invoices().some(i => {
      const a = this.sel()[i.id];
      if (!a) return false;
      return a.amount < 0 || a.currency < 0 ||
        a.amount > i.remaining_amount || a.currency > i.remaining_amount_currency ||
        (a.amount === 0 && a.currency === 0);
    }));

  canSubmit = computed(() =>
    this.supplierId() > 0 && this.safeId() > 0 &&
    (this.amount() > 0 || this.effectiveCurrency() > 0) &&
    !this.overAllocated() && !this.badAllocation() && !this.saving());

  ngOnInit() {
    this.lookup.moneySafes().subscribe({ next: s => this.safes.set(s) });

    // opened from an invoice: ?supplier=3&invoice=12
    const qp = this.route.snapshot.queryParamMap;
    const supplier = Number(qp.get('supplier'));
    const invoice = Number(qp.get('invoice'));
    if (supplier > 0) this.onSupplier(supplier, invoice > 0 ? invoice : undefined);
  }

  ngOnDestroy() { this.invSub?.unsubscribe(); }

  onSupplier(id: number, preselect?: number) {
    this.invSub?.unsubscribe();
    this.supplierId.set(id);
    this.invoices.set([]);
    this.sel.set({});
    this.invError.set(null);
    this.error.set(null);
    this.invLoading.set(false);
    if (!id) return;

    this.invLoading.set(true);
    this.invSub = this.invoicesApi.getUnpaid(id).subscribe({
      next: list => {
        this.invoices.set(list);
        this.invLoading.set(false);
        const inv = preselect ? list.find(i => i.id === preselect) : undefined;
        if (inv) this.toggle(inv);
      },
      error: err => {
        this.invError.set(apiError(err, 'فشل تحميل فواتير المورد'));
        this.invLoading.set(false);
      },
    });
  }

  toggle(inv: BuyInvoice) {
    const next = { ...this.sel() };
    if (inv.id in next) {
      delete next[inv.id];
    } else {
      // empty amounts follow the first invoice chosen
      if (this.amount() === 0 && this.amountCurrency() === 0) {
        this.amount.set(inv.remaining_amount);
        if (this.isMulti()) this.amountCurrency.set(inv.remaining_amount_currency);
      }
      const free = round2(this.amount() - this.allocatedSum());
      const freeCur = round2(this.effectiveCurrency() - this.allocatedCurrency());
      next[inv.id] = {
        amount: round2(Math.min(inv.remaining_amount, Math.max(free, 0))),
        currency: this.isMulti()
          ? round2(Math.min(inv.remaining_amount_currency, Math.max(freeCur, 0)))
          : 0,
      };
    }
    this.sel.set(next);
  }

  setAllocation(inv: BuyInvoice, field: keyof Alloc, value: number) {
    this.sel.update(s => ({ ...s, [inv.id]: { ...s[inv.id], [field]: round2(+value || 0) } }));
  }

  /** spreads both amounts over the invoices, oldest first (the server sends them by date) */
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
    if (!auditorId) {
      this.error.set('تعذر تحديد الموظف الحالي، سجل الدخول مرة اخرى');
      return;
    }

    const left = this.unallocated();
    const leftCur = this.unallocatedCurrency();
    if (left > 0 || leftCur > 0) {
      const none = this.selectedCount() === 0;
      const part = [left > 0 ? `${left} جنيه` : '', leftCur > 0 ? `${leftCur} عملة` : '']
        .filter(Boolean).join(' و ');
      const ok = await this.confirm.confirm({
        title: none ? 'دفعة بدون فاتورة' : 'مبلغ غير موزع',
        message: none
          ? `لم تحدد اي فاتورة. سيتم اضافة المبلغ كاملا (${part}) الى رصيد المورد. هل تريد المتابعة؟`
          : `المبلغ المتبقي (${part}) بعد توزيعه على الفواتير سيضاف الى رصيد المورد. هل تريد المتابعة؟`,
        confirmText: 'متابعة',
        danger: false,
      });
      if (!ok) return;
    }

    this.saving.set(true);
    this.error.set(null);

    this.service.createAllocated({
      date: this.date(),
      supplier_id: this.supplierId(),
      money_safe_id: this.safeId(),
      amount: this.amount(),
      amount_currency: this.effectiveCurrency(),
      notes: this.notes(),
      auditor_id: auditorId,
      allocations: Object.entries(this.sel()).map(([id, a]) => ({
        invoice_id: +id,
        amount: a.amount,
        amount_currency: this.isMulti() ? a.currency : 0,
      })),
    }).subscribe({
      next: () => this.router.navigate(['/supplier-payments']),
      error: err => {
        this.error.set(apiError(err, 'فشل حفظ الدفعة'));
        this.saving.set(false);
      },
    });
  }
}