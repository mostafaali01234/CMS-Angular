// sale-return-form/sale-return-form.ts
import { Component, computed, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Observable, Subscription } from 'rxjs';
import { SaleInvoiceService } from '../sale-invoice.service';
import { ReturnableItem, SaleInvoice, SaleReturnableInvoice, SaveSaleReturn } from '../sale-invoice.model';
import { CustomerPaymentService } from '../../customer-payments/customer-payment.service';
import { Refundable } from '../../customer-payments/customer-payment.model';
import { LookupService } from '../../../shared/services/lookup.service';
import { activeOnly, CustomerOption, MoneySafeOption } from '../../../shared/models/lookup.model';
import { LookupSelect } from '../../../shared/components/lookup-select/lookup-select';
import { SearchSelect } from '../../../shared/components/search-select/search-select';
import { AuthService } from '../../../core/services/AuthService/auth'; 
import { apiError } from '../../../shared/utils/api';

const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

@Component({
  selector: 'app-sale-return-form',
  imports: [FormsModule, RouterLink, DatePipe, DecimalPipe, SearchSelect, LookupSelect],
  templateUrl: './sale-return-form.html',
})
export class SaleReturnForm implements OnInit, OnDestroy {
  private service = inject(SaleInvoiceService);
  private payments = inject(CustomerPaymentService);
  private auth = inject(AuthService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  lookup = inject(LookupService);
  activeOnly = activeOnly;
  customerText = (c: CustomerOption) => (c.phone ? `${c.name} - ${c.phone}` : c.name);

  id = signal<number | null>(null);
  customerId = signal(0);
  invoiceId = signal(0);
  date = signal(new Date().toISOString().slice(0, 10));
  notes = signal('');

  invoices = signal<SaleInvoice[]>([]);
  returnable = signal<SaleReturnableInvoice | null>(null);
  qty = signal<Record<number, number>>({});
  ret = signal<SaleInvoice | null>(null);          // the saved return (edit mode)

  loading = signal(false);
  invLoading = signal(false);
  retLoading = signal(false);
  saving = signal(false);
  error = signal<string | null>(null);

  // refund panel (edit mode)
  safes = signal<MoneySafeOption[]>([]);
  refundable = signal<Refundable>({ amount: 0, amount_currency: 0 });
  rfDate = signal(new Date().toISOString().slice(0, 10));
  rfSafe = signal(0);
  rfAmount = signal(0);
  rfCurrency = signal(0);
  rfNotes = signal('');
  refunding = signal(false);
  rfError = signal<string | null>(null);

  private auditorId = 0;
  private invSub?: Subscription;
  private retSub?: Subscription;

  isMulti = (safeId: number) => this.safes().find(s => s.id === safeId)?.is_multi_currency ?? false;
  safeName = (safeId: number) => this.safes().find(s => s.id === safeId)?.name ?? '';
  refunds = computed(() => (this.ret()?.payment ?? []).filter(p => p.type === 'Refund_Payment'));

  lineValue(r: ReturnableItem) {
    const q = this.qty()[r.item_id] ?? 0;
    const total = round2(r.product_price * q);
    const discount = r.original_quantity > 0 ? round2(r.product_discount * q / r.original_quantity) : 0;
    return round2(total - discount);
  }
  isCurrency = (r: ReturnableItem) => r.price_type === 'Currency';
  totalEgp = computed(() => round2((this.returnable()?.items ?? []).filter(r => !this.isCurrency(r)).reduce((s, r) => s + this.lineValue(r), 0)));
  totalCurrency = computed(() => round2((this.returnable()?.items ?? []).filter(r => this.isCurrency(r)).reduce((s, r) => s + this.lineValue(r), 0)));
  chosenCount = computed(() => Object.values(this.qty()).filter(q => q > 0).length);
  canSubmit = computed(() => this.invoiceId() > 0 && this.chosenCount() > 0 && !this.saving());

  ngOnInit() {
    this.lookup.moneySafes().subscribe({ next: s => this.safes.set(s) });

    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) { this.id.set(+idParam); this.loadReturn(+idParam); return; }

    this.auditorId = Number(this.auth.employeeId()) || 0;
    const qp = this.route.snapshot.queryParamMap;
    const customer = Number(qp.get('customer'));
    const invoice = Number(qp.get('invoice'));
    if (customer > 0) this.onCustomer(customer, invoice > 0 ? invoice : undefined);
  }

  ngOnDestroy() { this.invSub?.unsubscribe(); this.retSub?.unsubscribe(); }

  private loadReturn(id: number) {
    this.loading.set(true);
    this.service.getById(id).subscribe({
      next: ret => {
        this.ret.set(ret);
        this.date.set(ret.date.slice(0, 10));
        this.notes.set(ret.notes ?? '');
        this.customerId.set(ret.customer_id);
        this.auditorId = ret.auditor_id;

        const q: Record<number, number> = {};
        ret.items.forEach(i => { if (i.original_item_id) q[i.original_item_id] = i.product_quantity; });

        this.service.getReturnable(ret.original_invoice_id!, id).subscribe({
          next: r => { this.returnable.set(r); this.invoiceId.set(r.invoice_id); this.qty.set(q); this.loading.set(false); },
          error: err => { this.error.set(apiError(err, 'فشل تحميل بيانات الفاتورة الاصلية')); this.loading.set(false); },
        });
        this.loadRefundable(id);
      },
      error: err => { this.error.set(apiError(err, 'فشل تحميل المرتجع')); this.loading.set(false); },
    });
  }

  private loadRefundable(id: number) {
    this.payments.getRefundable(id).subscribe({
      next: r => { this.refundable.set(r); this.rfAmount.set(r.amount); this.rfCurrency.set(r.amount_currency); },
    });
  }

  onCustomer(customerId: number, preselect?: number) {
    this.invSub?.unsubscribe();
    this.retSub?.unsubscribe();
    this.customerId.set(customerId);
    this.invoices.set([]); this.invoiceId.set(0); this.returnable.set(null); this.qty.set({});
    this.error.set(null); this.invLoading.set(false); this.retLoading.set(false);
    if (!customerId) return;

    this.invLoading.set(true);
    this.invSub = this.service.getSalesByCustomer(customerId).subscribe({
      next: list => {
        this.invoices.set(list);
        this.invLoading.set(false);
        if (preselect && list.some(i => i.id === preselect)) this.onInvoice(preselect);
      },
      error: err => { this.error.set(apiError(err, 'فشل تحميل فواتير العميل')); this.invLoading.set(false); },
    });
  }

  onInvoice(invoiceId: number) {
    this.retSub?.unsubscribe();
    this.invoiceId.set(invoiceId);
    this.returnable.set(null); this.qty.set({}); this.error.set(null); this.retLoading.set(false);
    if (!invoiceId) return;

    this.retLoading.set(true);
    this.retSub = this.service.getReturnable(invoiceId).subscribe({
      next: r => { this.returnable.set(r); this.retLoading.set(false); },
      error: err => { this.error.set(apiError(err, 'فشل تحميل اصناف الفاتورة')); this.retLoading.set(false); },
    });
  }

  setQty(r: ReturnableItem, value: number) {
    const q = Math.min(Math.max(+value || 0, 0), r.returnable_quantity);
    this.qty.update(m => ({ ...m, [r.item_id]: q }));
  }
  returnAll(r: ReturnableItem) { this.setQty(r, r.returnable_quantity); }

  submit() {
    if (!this.canSubmit()) return;
    if (!this.auditorId) { this.error.set('تعذر تحديد الموظف الحالي، سجل الدخول مرة اخرى'); return; }

    this.saving.set(true);
    this.error.set(null);

    const payload: SaveSaleReturn = {
      date: this.date(),
      notes: this.notes(),
      original_invoice_id: this.invoiceId(),
      auditor_id: this.auditorId,
      items: Object.entries(this.qty()).filter(([, q]) => q > 0)
        .map(([itemId, quantity]) => ({ original_item_id: +itemId, quantity })),
    };

    if (this.id()) {
      this.service.updateReturn(this.id()!, payload).subscribe({
        next: () => { this.saving.set(false); this.loadReturn(this.id()!); },
        error: err => { this.error.set(apiError(err, 'فشل حفظ المرتجع')); this.saving.set(false); },
      });
    } else {
      // after creating, open the return so the refund can be entered
      this.service.createReturn(payload).subscribe({
        next: created => this.router.navigate(['/sale-invoices', 'returns', created.id, 'edit']),
        error: err => { this.error.set(apiError(err, 'فشل حفظ المرتجع')); this.saving.set(false); },
      });
    }
  }

  addRefund() {
    const ret = this.ret();
    if (!ret) return;
    if (!this.rfSafe()) { this.rfError.set('اختر الخزينة'); return; }

    const amount = this.rfAmount();
    const cur = this.isMulti(this.rfSafe()) ? this.rfCurrency() : 0;
    if (amount <= 0 && cur <= 0) { this.rfError.set('ادخل مبلغا او مبلغا بالعملة'); return; }
    if (amount > this.refundable().amount) { this.rfError.set('المبلغ أكبر من المسموح باسترداده'); return; }
    if (cur > this.refundable().amount_currency) { this.rfError.set('المبلغ بالعملة أكبر من المسموح باسترداده'); return; }

    const auditorId = Number(this.auth.employeeId()) || 0;
    if (!auditorId) { this.rfError.set('تعذر تحديد الموظف الحالي، سجل الدخول مرة اخرى'); return; }

    this.refunding.set(true);
    this.rfError.set(null);
    this.payments.create({
      date: this.rfDate(),
      type: 'Refund_Payment',
      customer_id: ret.customer_id,
      invoice_id: ret.id,
      advance_payment_order_id: null,
      money_safe_id: this.rfSafe(),
      amount,
      amount_currency: cur,
      notes: this.rfNotes(),
      auditor_id: auditorId,
    }).subscribe({
      next: () => {
        this.refunding.set(false);
        this.rfSafe.set(0); this.rfNotes.set('');
        this.loadReturn(ret.id);
      },
      error: err => { this.rfError.set(apiError(err, 'فشل حفظ الاسترداد')); this.refunding.set(false); },
    });
  }
}