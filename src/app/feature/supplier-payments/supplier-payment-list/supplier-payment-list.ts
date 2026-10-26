// supplier-payment-list/supplier-payment-list.ts
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { SupplierPaymentService } from '../supplier-payment.service';
import { SupplierPayment } from '../supplier-payment.model';
import { ConfirmService } from '../../../shared/services/confirm.service';
import { LookupService } from '../../../shared/services/lookup.service';
import { LookupSelect } from '../../../shared/components/lookup-select/lookup-select';
import { apiError } from '../../../shared/utils/api';

const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

@Component({
  selector: 'app-supplier-payment-list',
  imports: [RouterLink, FormsModule, DatePipe, DecimalPipe, LookupSelect],
  templateUrl: './supplier-payment-list.html',
})
export class SupplierPaymentList implements OnInit {
  private service = inject(SupplierPaymentService);
  private confirm = inject(ConfirmService);
  lookup = inject(LookupService);

  payments = signal<SupplierPayment[]>([]);
  search = signal('');
  dateFrom = signal('');
  dateTo = signal('');
  supplierId = signal(0);

  loading = signal(true);
  error = signal<string | null>(null);
  actionError = signal<string | null>(null);
  deletingId = signal<number | null>(null);

  filtered = computed(() => {
    const q = this.search().trim().toLowerCase();
    const from = this.dateFrom();
    const to = this.dateTo();
    const sup = this.supplierId();

    return this.payments().filter(p => {
      const d = (p.date ?? '').slice(0, 10);
      if (from && d < from) return false;
      if (to && d > to) return false;
      if (sup && p.supplier_id !== sup) return false;
      if (!q) return true;
      return String(p.invoice_number ?? '') === q ||
        [p.supplier_name, p.money_safe_name, p.notes].some(v => (v ?? '').toLowerCase().includes(q));
    });
  });

  totalAmount = computed(() => round2(this.filtered().reduce((s, p) => s + p.amount, 0)));

  ngOnInit() { this.load(); }

  load() {
    this.loading.set(true);
    this.error.set(null);
    this.service.getAll().subscribe({
      next: data => {
        this.payments.set([...data].sort((a, b) => b.date.localeCompare(a.date) || b.id - a.id));
        this.loading.set(false);
      },
      error: err => {
        this.error.set(apiError(err, 'فشل تحميل الدفعات'));
        this.loading.set(false);
      },
    });
  }

  clearFilters() {
    this.search.set('');
    this.dateFrom.set('');
    this.dateTo.set('');
    this.supplierId.set(0);
  }

  async remove(p: SupplierPayment) {
    const ok = await this.confirm.confirm({
      title: 'حذف دفعة',
      message: `هل أنت متأكد من حذف دفعة ${p.amount} للمورد "${p.supplier_name}"؟`,
      confirmText: 'حذف',
      danger: true,
    });
    if (!ok) return;

    this.actionError.set(null);
    this.deletingId.set(p.id);
    this.service.delete(p.id).subscribe({
      next: () => {
        this.payments.update(list => list.filter(x => x.id !== p.id));
        this.deletingId.set(null);
      },
      error: err => {
        this.actionError.set(apiError(err, 'فشل حذف الدفعة'));
        this.deletingId.set(null);
      },
    });
  }
}