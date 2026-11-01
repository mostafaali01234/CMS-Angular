// store-transaction-form/store-transaction-form.ts
import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormBuilder, NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Observable } from 'rxjs';
import { StoreTransactionService } from '../store-transaction.service';
import { SaveStoreTransaction, TransactionItem } from '../store-transaction.model';
import { LookupService } from '../../../shared/services/lookup.service';
import { activeOnly, ProductOption } from '../../../shared/models/lookup.model';
import { LookupSelect } from '../../../shared/components/lookup-select/lookup-select';
import { SearchSelect } from '../../../shared/components/search-select/search-select';
import { AuthService } from '../../../core/services/AuthService/auth'; 
import { today } from '../../../shared/utils/date';
import { apiError } from '../../../shared/utils/api';

const itemGroup = (fb: NonNullableFormBuilder, i?: TransactionItem) =>
  fb.group({
    item_id: [i?.item_id ?? 0, [Validators.min(1)]],
    quantity: [i?.quantity ?? 1, [Validators.required, Validators.min(0.01)]],
  });

type ItemGroup = ReturnType<typeof itemGroup>;

@Component({
  selector: 'app-store-transaction-form',
  imports: [ReactiveFormsModule, RouterLink, LookupSelect, SearchSelect],
  templateUrl: './store-transaction-form.html',
})
export class StoreTransactionForm implements OnInit {
  private fb = inject(FormBuilder);
  private service = inject(StoreTransactionService);
  private auth = inject(AuthService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  lookup = inject(LookupService);
  activeOnly = activeOnly;
  productText = (p: ProductOption) => (p.barcode ? `${p.name} - ${p.barcode}` : p.name);

  id = signal<number | null>(null);
  loading = signal(false);
  saving = signal(false);
  error = signal<string | null>(null);

  private auditorId = 0;

  form = this.fb.nonNullable.group({
    transaction_date: [today(), [Validators.required]],
    out_store_id: [0, [Validators.min(1)]],
    in_store_id: [0, [Validators.min(1)]],
    notes: ['', [Validators.maxLength(2000)]],
    items: this.fb.array<ItemGroup>([]),
  });

  get items() { return this.form.controls.items; }

  addItem(i?: TransactionItem) { this.items.push(itemGroup(this.fb.nonNullable, i)); }
  removeItem(i: number) { this.items.removeAt(i); }

  ngOnInit() {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (!idParam) {
      this.auditorId = Number(this.auth.employeeId()) || 0;
      this.addItem();
      return;
    }

    this.id.set(+idParam);
    this.loading.set(true);
    this.service.getById(+idParam).subscribe({
      next: t => {
        this.form.patchValue({
          transaction_date: t.transaction_date.slice(0, 10),
          out_store_id: t.out_store_id,
          in_store_id: t.in_store_id,
          notes: t.notes ?? '',
        });
        t.transaction_items.forEach(i => this.addItem(i));
        if (this.items.length === 0) this.addItem();
        this.auditorId = t.auditor_id;
        this.loading.set(false);
      },
      error: err => { this.error.set(apiError(err, 'فشل تحميل الحركة')); this.loading.set(false); },
    });
  }

  save() {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    if (!this.auditorId) { this.error.set('تعذر تحديد الموظف الحالي، سجل الدخول مرة اخرى'); return; }

    const v = this.form.getRawValue();
    if (v.out_store_id === v.in_store_id) {
      this.error.set('لا يمكن النقل من مخزن الى نفسه');
      return;
    }
    if (v.items.length === 0) { this.error.set('أضف منتجا واحدا على الأقل'); return; }

    const ids = v.items.map(i => i.item_id);
    if (new Set(ids).size !== ids.length) { this.error.set('لا يمكن تكرار نفس المنتج'); return; }

    this.saving.set(true);
    this.error.set(null);

    const payload: SaveStoreTransaction = {
      id: this.id() ?? 0,
      transaction_date: v.transaction_date,
      auditor_id: this.auditorId,
      notes: v.notes,
      out_store_id: v.out_store_id,
      in_store_id: v.in_store_id,
      transaction_items: v.items,
    };

    const request$: Observable<unknown> = this.id()
      ? this.service.update(this.id()!, payload)
      : this.service.create(payload);

    request$.subscribe({
      next: () => this.router.navigate(['/store-transactions']),
      error: err => { this.error.set(apiError(err, 'فشل حفظ الحركة')); this.saving.set(false); },
    });
  }

  invalid(name: string) {
    const c = this.form.get(name);
    return !!c && c.invalid && (c.touched || c.dirty);
  }
  invalidItem(i: number, name: string) {
    const c = this.items.at(i).get(name);
    return !!c && c.invalid && (c.touched || c.dirty);
  }
}