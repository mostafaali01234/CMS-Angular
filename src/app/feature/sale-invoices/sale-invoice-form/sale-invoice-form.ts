// sale-invoice-form/sale-invoice-form.ts
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormBuilder, FormsModule, NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Observable } from 'rxjs';
import { SaleInvoiceService } from '../sale-invoice.service';
import { PRICE_TYPES, SaleInvoice, SaleInvoiceItem, SaveSaleInvoice } from '../sale-invoice.model';
import { CustomerPaymentService } from '../../customer-payments/customer-payment.service';
import { paymentLabel } from '../../customer-payments/customer-payment.model';
import { LookupService } from '../../../shared/services/lookup.service';
import { activeOnly, CustomerOption, MoneySafeOption, ProductOption } from '../../../shared/models/lookup.model';
import { LookupSelect } from '../../../shared/components/lookup-select/lookup-select';
import { SearchSelect } from '../../../shared/components/search-select/search-select';
import { AuthService } from '../../../core/services/AuthService/auth'; 
import { apiError } from '../../../shared/utils/api';

const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;
const today = () => new Date().toISOString().slice(0, 10);

const itemGroup = (fb: NonNullableFormBuilder, i?: SaleInvoiceItem) =>
  fb.group({
    product_id: [i?.product_id ?? 0, [Validators.min(1)]],
    store_id: [i?.store_id ?? 0, [Validators.min(1)]],
    project_id: [i?.project_id ?? 0],
    product_notes: [i?.product_notes ?? '', [Validators.maxLength(500)]],
    price_type: [i?.price_type ?? PRICE_TYPES[0].value, [Validators.required]],
    product_price: [i?.product_price ?? 0, [Validators.required, Validators.min(0)]],
    product_quantity: [i?.product_quantity ?? 1, [Validators.required, Validators.min(0.01)]],
    product_discount: [i?.product_discount ?? 0, [Validators.required, Validators.min(0)]],
  });

const paymentGroup = (fb: NonNullableFormBuilder, date: string) =>
  fb.group({
    payment_date: [date, [Validators.required]],
    money_safe_id: [0, [Validators.min(1)]],
    amount: [0, [Validators.required, Validators.min(0)]],
    amount_currency: [0, [Validators.min(0)]],
    notes: ['', [Validators.maxLength(2000)]],
  });

type ItemGroup = ReturnType<typeof itemGroup>;
type PaymentGroup = ReturnType<typeof paymentGroup>;

@Component({
  selector: 'app-sale-invoice-form',
  imports: [ReactiveFormsModule, FormsModule, RouterLink, DecimalPipe, LookupSelect, SearchSelect],
  templateUrl: './sale-invoice-form.html',
})
export class SaleInvoiceForm implements OnInit {
  private fb = inject(FormBuilder);
  private service = inject(SaleInvoiceService);
  private payments = inject(CustomerPaymentService);
  private auth = inject(AuthService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  lookup = inject(LookupService);
  activeOnly = activeOnly;
  priceTypes = PRICE_TYPES;
  payLabel = paymentLabel;
  isSuper = this.auth.hasRole('SuperAdmin');
  customerText = (c: CustomerOption) => (c.phone ? `${c.name} - ${c.phone}` : c.name);
  productText = (p: ProductOption) => (p.barcode ? `${p.name} - ${p.barcode}` : p.name);

  id = signal<number | null>(null);
  invoice = signal<SaleInvoice | null>(null);
  loading = signal(false);
  saving = signal(false);
  error = signal<string | null>(null);
  safes = signal<MoneySafeOption[]>([]);

  // order link (create only)
  orderId = signal<number | null>(null);
  orderInput = signal('');
  orderLoading = signal(false);
  orderMsg = signal<string | null>(null);
  advanceEgp = signal(0);
  advanceCur = signal(0);

  hasPayments = computed(() => (this.invoice()?.paid_amount ?? 0) > 0 || (this.invoice()?.paid_amount_currency ?? 0) > 0);
  hasReturns = computed(() => (this.invoice()?.returned_amount ?? 0) > 0 || (this.invoice()?.returned_amount_currency ?? 0) > 0);
  // normal users can't edit once there are payments or returns; SuperAdmin always can
  locked = computed(() => !this.isSuper && (this.hasPayments() || this.hasReturns()));
  // even SuperAdmin can't change the items of an invoice that has returns
  itemsLocked = computed(() => this.locked() || this.hasReturns());

  private auditorId = 0;
  private shiftId: number | null = null;

  form = this.fb.nonNullable.group({
    date: [today(), [Validators.required]],
    customer_id: [0, [Validators.min(1)]],
    notes: ['', [Validators.maxLength(2000)]],
    items: this.fb.array<ItemGroup>([]),
    payments: this.fb.array<PaymentGroup>([]),   // create only
  });

  // payment panel on the edit page
  payDate = signal(today());
  paySafeId = signal(0);
  payAmount = signal(0);
  payCurrency = signal(0);
  payNotes = signal('');
  paying = signal(false);
  payError = signal<string | null>(null);

  get items() { return this.form.controls.items; }
  get paymentRows() { return this.form.controls.payments; }

  isMulti(safeId: number) { return this.safes().find(s => s.id === safeId)?.is_multi_currency ?? false; }
  safeName(safeId: number) { return this.safes().find(s => s.id === safeId)?.name ?? ''; }

  addItem(i?: SaleInvoiceItem) { this.items.push(itemGroup(this.fb.nonNullable, i)); }
  removeItem(i: number) { this.items.removeAt(i); }
  removePaymentRow(i: number) { this.paymentRows.removeAt(i); }
  addPaymentRow() {
    const g = paymentGroup(this.fb.nonNullable, this.form.controls.date.value);
    if (this.paymentRows.length === 0) {
      g.controls.amount.setValue(Math.max(this.remainingToPay, 0));
      g.controls.amount_currency.setValue(Math.max(this.remainingCurrencyToPay, 0));
    }
    this.paymentRows.push(g);
  }

  onProductPicked(g: ItemGroup, p: ProductOption) {
    if (g.controls.price_type.value === 'Egyptian') g.controls.product_price.setValue(p.sale_price);
  }

  // ---- totals shown on the page (the server recalculates them) ----
  isCurrency(g: ItemGroup) { return g.controls.price_type.value === 'Currency'; }
  lineTotal(g: ItemGroup) { const v = g.getRawValue(); return round2(v.product_price * v.product_quantity); }
  lineNet(g: ItemGroup) { return round2(this.lineTotal(g) - g.getRawValue().product_discount); }
  private egpLines() { return this.items.controls.filter(g => !this.isCurrency(g)); }
  private curLines() { return this.items.controls.filter(g => this.isCurrency(g)); }

  get total() { return round2(this.egpLines().reduce((s, g) => s + this.lineTotal(g), 0)); }
  get discount() { return round2(this.egpLines().reduce((s, g) => s + g.getRawValue().product_discount, 0)); }
  get netTotal() { return round2(this.total - this.discount); }
  get netTotalCurrency() { return round2(this.curLines().reduce((s, g) => s + this.lineNet(g), 0)); }
  get newPaymentsSum() { return round2(this.paymentRows.controls.reduce((s, g) => s + g.getRawValue().amount, 0)); }
  get newPaymentsCurrencySum() {
    return round2(this.paymentRows.controls.reduce((s, g) =>
      s + (this.isMulti(g.getRawValue().money_safe_id) ? g.getRawValue().amount_currency : 0), 0));
  }
  // the advance is attached by the server, so it already counts as paid
  get remainingToPay() { return round2(this.netTotal - this.advanceEgp() - this.newPaymentsSum); }
  get remainingCurrencyToPay() { return round2(this.netTotalCurrency - this.advanceCur() - this.newPaymentsCurrencySum); }

  ngOnInit() {
    this.lookup.moneySafes().subscribe({ next: s => this.safes.set(s) });

    const idParam = this.route.snapshot.paramMap.get('id');
    if (!idParam) {
      this.auditorId = Number(this.auth.employeeId()) || 0;
      const order = Number(this.route.snapshot.queryParamMap.get('order'));
      if (order > 0) { this.orderInput.set(String(order)); this.loadOrder(); }
      else this.addItem();
      return;
    }
    this.id.set(+idParam);
    this.load();
  }

  /** fills the customer and the items from an order */
  loadOrder() {
    const id = Math.trunc(+this.orderInput());
    if (!id) return;
    this.orderLoading.set(true);
    this.orderMsg.set(null);

    this.service.getDraftFromOrder(id).subscribe({
      next: d => {
        this.orderId.set(d.order_id ?? id);
        this.form.controls.customer_id.setValue(d.customer_id);
        this.items.clear();
        d.order_items.forEach(i => this.addItem({ ...i, store_id: 0, project_id: null, product_notes: '', price_type: 'Egyptian' }));
        if (this.items.length === 0) this.addItem();
        this.advanceEgp.set(d.order_advance_amount);
        this.advanceCur.set(d.order_advance_amount_currency);
        this.orderMsg.set(
          `الطلب #${id} - ${d.customer_name} - صافي الطلب ${d.order_net_total}` +
          (d.order_advance_amount > 0 ? ` - دفعات مقدمة ${d.order_advance_amount}` : '') +
          '. اختر المخزن لكل صنف.');
        this.orderLoading.set(false);
      },
      error: err => { this.orderMsg.set(apiError(err, 'فشل تحميل الطلب')); this.orderLoading.set(false); },
    });
  }

  clearOrder() {
    this.orderId.set(null);
    this.orderInput.set('');
    this.orderMsg.set(null);
    this.advanceEgp.set(0);
    this.advanceCur.set(0);
  }

  load() {
    this.loading.set(true);
    this.service.getById(this.id()!).subscribe({
      next: inv => {
        if (inv.type !== 'Sale') {   // a return opened by URL goes to its own page
          this.router.navigate(['/sale-invoices', 'returns', inv.id, 'edit'], { replaceUrl: true });
          return;
        }
        this.apply(inv);
        this.loading.set(false);
      },
      error: err => { this.error.set(apiError(err, 'فشل تحميل الفاتورة')); this.loading.set(false); },
    });
  }

  private apply(inv: SaleInvoice) {
    this.form.enable();
    this.items.clear();
    this.form.patchValue({ date: inv.date.slice(0, 10), customer_id: inv.customer_id, notes: inv.notes ?? '' });
    inv.items.forEach(i => this.addItem(i));

    this.invoice.set(inv);
    this.auditorId = inv.auditor_id;
    this.shiftId = inv.shift_id ?? null;
    this.orderId.set(inv.order_id ?? null);
    this.payAmount.set(inv.remaining_amount);
    this.payCurrency.set(inv.remaining_amount_currency);

    if (this.locked()) this.form.disable();
    else if (this.isSuper && this.hasReturns()) { this.items.disable(); this.form.controls.customer_id.disable(); }
    else if (this.isSuper && this.hasPayments()) this.form.controls.customer_id.disable();
    this.form.markAsPristine();
  }

  save() {
    if (this.locked()) return;
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    if (!this.auditorId) { this.error.set('تعذر تحديد الموظف الحالي، سجل الدخول مرة اخرى'); return; }

    const v = this.form.getRawValue();
    if (v.items.length === 0) { this.error.set('أضف منتجا واحدا على الأقل'); return; }
    if (this.items.controls.some(g => g.getRawValue().product_discount > this.lineTotal(g))) {
      this.error.set('الخصم لا يمكن أن يتجاوز اجمالي السطر');
      return;
    }
    if (!this.id()) {
      if (this.remainingToPay < 0) { this.error.set('مجموع الدفعات أكبر من صافي الفاتورة'); return; }
      if (this.remainingCurrencyToPay < 0) { this.error.set('مجموع الدفعات بالعملة أكبر من صافي الفاتورة بالعملة'); return; }
      const empty = v.payments.some(p => p.amount <= 0 && (!this.isMulti(p.money_safe_id) || p.amount_currency <= 0));
      if (empty) { this.error.set('كل دفعة تحتاج مبلغا (او مبلغا بالعملة لخزينة متعددة العملات)'); return; }
    }

    this.saving.set(true);
    this.error.set(null);

    const payload: SaveSaleInvoice = {
      id: this.id() ?? 0,
      type: 'Sale',
      date: v.date,
      notes: v.notes,
      customer_id: v.customer_id,
      auditor_id: this.auditorId,
      order_id: this.orderId(),
      shift_id: this.shiftId,
      items: v.items.map(i => ({ ...i, project_id: i.project_id || null })),
      payment: this.id() ? [] : v.payments.map(p => ({
        ...p,
        amount_currency: this.isMulti(p.money_safe_id) ? p.amount_currency : 0,
        auditor_id: this.auditorId,
      })),
    };

    const request$: Observable<unknown> = this.id()
      ? this.service.update(this.id()!, payload)
      : this.service.create(payload);

    request$.subscribe({
      next: () => this.router.navigate(['/sale-invoices']),
      error: err => { this.error.set(apiError(err, 'فشل حفظ الفاتورة')); this.saving.set(false); },
    });
  }

  addPayment() {
    const inv = this.invoice();
    if (!inv) return;
    if (this.form.dirty) { this.payError.set('احفظ تعديلات الفاتورة اولا'); return; }
    if (!this.paySafeId()) { this.payError.set('اختر الخزينة'); return; }

    const amount = this.payAmount();
    const cur = this.isMulti(this.paySafeId()) ? this.payCurrency() : 0;
    if (amount <= 0 && cur <= 0) { this.payError.set('ادخل مبلغا او مبلغا بالعملة'); return; }
    if (amount > inv.remaining_amount) { this.payError.set('المبلغ أكبر من المتبقي على الفاتورة'); return; }
    if (cur > inv.remaining_amount_currency) { this.payError.set('المبلغ بالعملة أكبر من المتبقي بالعملة'); return; }

    const auditorId = Number(this.auth.employeeId()) || 0;
    if (!auditorId) { this.payError.set('تعذر تحديد الموظف الحالي، سجل الدخول مرة اخرى'); return; }

    this.paying.set(true);
    this.payError.set(null);
    this.payments.create({
      date: this.payDate(),
      type: 'Regular_Payment',
      customer_id: inv.customer_id,
      invoice_id: inv.id,
      advance_payment_order_id: null,
      money_safe_id: this.paySafeId(),
      amount,
      amount_currency: cur,
      notes: this.payNotes(),
      auditor_id: auditorId,
    }).subscribe({
      next: () => {
        this.paying.set(false);
        this.paySafeId.set(0); this.payNotes.set('');
        this.load();
      },
      error: err => { this.payError.set(apiError(err, 'فشل حفظ الدفعة')); this.paying.set(false); },
    });
  }

  invalid(name: string) { const c = this.form.get(name); return !!c && c.invalid && (c.touched || c.dirty); }
  invalidItem(i: number, name: string) { const c = this.items.at(i).get(name); return !!c && c.invalid && (c.touched || c.dirty); }
  invalidPay(i: number, name: string) { const c = this.paymentRows.at(i).get(name); return !!c && c.invalid && (c.touched || c.dirty); }
}