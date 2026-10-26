// buy-return-form/buy-return-form.ts
import { Component, computed, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Observable, Subscription } from 'rxjs';
import { BuyInvoiceService } from '../buy-invoice.service';
import { BuyInvoice, ReturnableInvoice, ReturnableItem, SaveBuyReturn } from '../buy-invoice.model';
import { LookupService } from '../../../shared/services/lookup.service';
import { SupplierOption } from '../../../shared/models/lookup.model';
import { SearchSelect } from '../../../shared/components/search-select/search-select';
import { AuthService } from '../../../core/services/AuthService/auth';
import { apiError } from '../../../shared/utils/api';

const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

@Component({
  selector: 'app-buy-return-form',
  imports: [FormsModule, RouterLink, DatePipe, DecimalPipe, SearchSelect],
  templateUrl: './buy-return-form.html',
})
export class BuyReturnForm implements OnInit, OnDestroy {
  private service = inject(BuyInvoiceService);
  private auth = inject(AuthService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  lookup = inject(LookupService);
  supplierText = (s: SupplierOption) => (s.phone ? `${s.name} - ${s.phone}` : s.name);

  id = signal<number | null>(null);
  supplierId = signal(0);
  invoiceId = signal(0);
  number = signal(0);
  date = signal(new Date().toISOString().slice(0, 10));
  notes = signal('');

  invoices = signal<BuyInvoice[]>([]);          // the supplier's buy invoices, for the picker
  returnable = signal<ReturnableInvoice | null>(null);
  qty = signal<Record<number, number>>({});     // original item id -> quantity to return

  loading = signal(false);
  invLoading = signal(false);
  retLoading = signal(false);
  saving = signal(false);
  error = signal<string | null>(null);
  isCurrency = (r: ReturnableItem) => r.price_type === 'Currency';


  private auditorId = 0;
  private invSub?: Subscription;
  private retSub?: Subscription;

  // same arithmetic as the server
  lineValue(r: ReturnableItem) {
    const q = this.qty()[r.item_id] ?? 0;
    const total = round2(r.product_price * q);
    const discount = r.original_quantity > 0 ? round2(r.product_discount * q / r.original_quantity) : 0;
    return round2(total - discount);
  }

  totalValue = computed(() =>
    round2((this.returnable()?.items ?? []).reduce((s, r) => s + this.lineValue(r), 0)));
  totalEgp = computed(() => round2(
    (this.returnable()?.items ?? []).filter(r => !this.isCurrency(r)).reduce((s, r) => s + this.lineValue(r), 0)));
  totalCurrency = computed(() => round2(
    (this.returnable()?.items ?? []).filter(r => this.isCurrency(r)).reduce((s, r) => s + this.lineValue(r), 0)));

  chosenCount = computed(() => Object.values(this.qty()).filter(q => q > 0).length);

  canSubmit = computed(() =>
    this.invoiceId() > 0 && this.chosenCount() > 0 && !this.saving());

  ngOnInit() {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      this.id.set(+idParam);
      this.loadReturn(+idParam);
      return;
    }

    this.auditorId = Number(this.auth.employeeId()) || 0;
    const qp = this.route.snapshot.queryParamMap;
    const supplier = Number(qp.get('supplier'));
    const invoice = Number(qp.get('invoice'));
    if (supplier > 0) this.onSupplier(supplier, invoice > 0 ? invoice : undefined);
  }

  ngOnDestroy() {
    this.invSub?.unsubscribe();
    this.retSub?.unsubscribe();
  }

  private loadReturn(id: number) {
    this.loading.set(true);
    this.service.getById(id).subscribe({
      next: ret => {
        this.number.set(ret.number);
        this.date.set(ret.date.slice(0, 10));
        this.notes.set(ret.notes ?? '');
        this.supplierId.set(ret.supplier_id);
        this.auditorId = ret.auditor_id;

        const q: Record<number, number> = {};
        ret.items.forEach(i => { if (i.original_item_id) q[i.original_item_id] = i.product_quantity; });

        // this return's own quantities are left out of "already returned"
        this.service.getReturnable(ret.original_invoice_id!, id).subscribe({
          next: r => {
            this.returnable.set(r);
            this.invoiceId.set(r.invoice_id);
            this.qty.set(q);
            this.loading.set(false);
          },
          error: err => {
            this.error.set(apiError(err, 'فشل تحميل بيانات الفاتورة الاصلية'));
            this.loading.set(false);
          },
        });
      },
      error: err => {
        this.error.set(apiError(err, 'فشل تحميل المرتجع'));
        this.loading.set(false);
      },
    });
  }

  onSupplier(supplierId: number, preselectInvoice?: number) {
    this.invSub?.unsubscribe();
    this.retSub?.unsubscribe();
    this.supplierId.set(supplierId);
    this.invoices.set([]);
    this.invoiceId.set(0);
    this.returnable.set(null);
    this.qty.set({});
    this.error.set(null);
    this.invLoading.set(false);
    this.retLoading.set(false);
    if (!supplierId) return;

    this.invLoading.set(true);
    this.invSub = this.service.getBySupplier(supplierId).subscribe({
      next: list => {
        this.invoices.set(list);
        this.invLoading.set(false);
        if (preselectInvoice && list.some(i => i.id === preselectInvoice)) this.onInvoice(preselectInvoice);
      },
      error: err => {
        this.error.set(apiError(err, 'فشل تحميل فواتير المورد'));
        this.invLoading.set(false);
      },
    });
  }

  onInvoice(invoiceId: number) {
    this.retSub?.unsubscribe();
    this.invoiceId.set(invoiceId);
    this.returnable.set(null);
    this.qty.set({});
    this.error.set(null);
    this.retLoading.set(false);
    if (!invoiceId) return;

    this.retLoading.set(true);
    this.retSub = this.service.getReturnable(invoiceId).subscribe({
      next: r => { this.returnable.set(r); this.retLoading.set(false); },
      error: err => {
        this.error.set(apiError(err, 'فشل تحميل اصناف الفاتورة'));
        this.retLoading.set(false);
      },
    });
  }

  setQty(r: ReturnableItem, value: number) {
    const q = Math.min(Math.max(+value || 0, 0), r.returnable_quantity);
    this.qty.update(m => ({ ...m, [r.item_id]: q }));
  }

  returnAll(r: ReturnableItem) {
    this.setQty(r, r.returnable_quantity);
  }

  submit() {
    if (!this.canSubmit()) return;
    if (!this.auditorId) {
      this.error.set('تعذر تحديد الموظف الحالي، سجل الدخول مرة اخرى');
      return;
    }

    this.saving.set(true);
    this.error.set(null);

    const payload: SaveBuyReturn = {
      // number: this.number(),
      date: this.date(),
      notes: this.notes(),
      original_invoice_id: this.invoiceId(),
      auditor_id: this.auditorId,
      items: Object.entries(this.qty())
        .filter(([, q]) => q > 0)
        .map(([itemId, quantity]) => ({ original_item_id: +itemId, quantity })),
    };

    const request$: Observable<unknown> = this.id()
      ? this.service.updateReturn(this.id()!, payload)
      : this.service.createReturn(payload);

    request$.subscribe({
      next: () => this.router.navigate(['/buy-invoices']),
      error: err => {
        this.error.set(apiError(err, 'فشل حفظ المرتجع'));
        this.saving.set(false);
      },
    });
  }
}