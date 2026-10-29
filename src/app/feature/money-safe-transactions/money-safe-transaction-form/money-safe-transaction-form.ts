// money-safe-transaction-form/money-safe-transaction-form.ts
import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Observable } from 'rxjs';
import { MoneySafeTransactionService } from '../money-safe-transaction.service';
import { SaveMoneySafeTransaction, TRANSACTION_TYPES } from '../money-safe-transaction.model';
import { LookupService } from '../../../shared/services/lookup.service';
import { activeOnly, MoneySafeOption } from '../../../shared/models/lookup.model';
import { LookupSelect } from '../../../shared/components/lookup-select/lookup-select';
import { AuthService } from '../../../core/services/AuthService/auth';
import { today } from '../../../shared/utils/date';
import { apiError } from '../../../shared/utils/api';

@Component({
  selector: 'app-money-safe-transaction-form',
  imports: [ReactiveFormsModule, RouterLink, LookupSelect],
  templateUrl: './money-safe-transaction-form.html',
})
export class MoneySafeTransactionForm implements OnInit {
  private fb = inject(FormBuilder);
  private service = inject(MoneySafeTransactionService);
  private auth = inject(AuthService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  lookup = inject(LookupService);
  activeOnly = activeOnly;
  types = TRANSACTION_TYPES;

  id = signal<number | null>(null);
  loading = signal(false);
  saving = signal(false);
  error = signal<string | null>(null);
  safes = signal<MoneySafeOption[]>([]);

  private auditorId = 0;
  private shiftId: number | null = null;

  form = this.fb.nonNullable.group({
    transaction_date: [today(), [Validators.required]],
    transaction_type: [TRANSACTION_TYPES[0].value, [Validators.required]],
    out_money_safe_id: [0, [Validators.min(1)]],
    in_money_safe_id: [0, [Validators.min(1)]],
    transaction_amount: [0, [Validators.required, Validators.min(0)]],
    transaction_amount_currency: [0, [Validators.min(0)]],
    project_id: [0],
    transaction_notes: ['', [Validators.maxLength(2000)]],
  });

  private isMulti(safeId: number) {
    return this.safes().find(s => s.id === safeId)?.is_multi_currency ?? false;
  }

  // a currency amount needs both safes to hold currency
  get canCurrency() {
    const v = this.form.getRawValue();
    return this.isMulti(v.out_money_safe_id) && this.isMulti(v.in_money_safe_id);
  }

  ngOnInit() {
    this.lookup.moneySafes().subscribe({ next: s => this.safes.set(s) });

    const idParam = this.route.snapshot.paramMap.get('id');
    if (!idParam) {
      this.auditorId = Number(this.auth.employeeId()) || 0;
      return;
    }

    this.id.set(+idParam);
    this.loading.set(true);
    this.service.getById(+idParam).subscribe({
      next: t => {
        this.form.patchValue({
          transaction_date: t.transaction_date.slice(0, 10),
          transaction_type: t.transaction_type,
          out_money_safe_id: t.out_money_safe_id,
          in_money_safe_id: t.in_money_safe_id,
          transaction_amount: t.transaction_amount,
          transaction_amount_currency: t.transaction_amount_currency,
          project_id: t.project_id ?? 0,
          transaction_notes: t.transaction_notes ?? '',
        });
        this.auditorId = t.auditor_id;
        this.shiftId = t.shift_id ?? null;
        this.loading.set(false);
      },
      error: err => { this.error.set(apiError(err, 'فشل تحميل الحركة')); this.loading.set(false); },
    });
  }

  save() {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    if (!this.auditorId) { this.error.set('تعذر تحديد الموظف الحالي، سجل الدخول مرة اخرى'); return; }

    const v = this.form.getRawValue();
    if (v.out_money_safe_id === v.in_money_safe_id) {
      this.error.set('لا يمكن التحويل من خزينة الى نفسها');
      return;
    }

    const cur = this.canCurrency ? v.transaction_amount_currency : 0;
    if (v.transaction_amount <= 0 && cur <= 0) {
      this.error.set('ادخل مبلغا (او مبلغا بالعملة اذا كانت الخزينتان متعددتي العملات)');
      return;
    }

    this.saving.set(true);
    this.error.set(null);

    const payload: SaveMoneySafeTransaction = {
      id: this.id() ?? 0,
      transaction_date: v.transaction_date,
      transaction_type: v.transaction_type,
      transaction_notes: v.transaction_notes,
      transaction_amount: v.transaction_amount,
      transaction_amount_currency: cur,
      auditor_id: this.auditorId,
      out_money_safe_id: v.out_money_safe_id,
      in_money_safe_id: v.in_money_safe_id,
      project_id: v.project_id || null,
      shift_id: this.shiftId,
    };

    const request$: Observable<unknown> = this.id()
      ? this.service.update(this.id()!, payload)
      : this.service.create(payload);

    request$.subscribe({
      next: () => this.router.navigate(['/money-safe-transactions']),
      error: err => { this.error.set(apiError(err, 'فشل حفظ الحركة')); this.saving.set(false); },
    });
  }

  invalid(name: string) {
    const c = this.form.get(name);
    return !!c && c.invalid && (c.touched || c.dirty);
  }
}