// expense-form/expense-form.ts
import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Observable } from 'rxjs';
import { ExpenseService } from '../expense.service';
import { ExpenseData, SaveExpense } from '../expense.model';
import { LookupService } from '../../../shared/services/lookup.service';
import { activeOnly, MoneySafeOption } from '../../../shared/models/lookup.model';
import { LookupSelect } from '../../../shared/components/lookup-select/lookup-select';
import { AuthService } from '../../../core/services/AuthService/auth';
import { apiError } from '../../../shared/utils/api';
import { ExpenseCategoryTypeSelect } from '../../../shared/components/expense-category-type-select/expense-category-type-select';
import { today } from '../../../shared/utils/date';


const numOrNull = (v: unknown) => (v === null || v === undefined || v === '' ? null : +v);

@Component({
  selector: 'app-expense-form',
  imports: [ReactiveFormsModule, RouterLink, LookupSelect, ExpenseCategoryTypeSelect],
  templateUrl: './expense-form.html',
})
export class ExpenseForm implements OnInit {
  private fb = inject(FormBuilder);
  private service = inject(ExpenseService);
  private auth = inject(AuthService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  lookup = inject(LookupService);
  activeOnly = activeOnly;

  id = signal<number | null>(null);
  loading = signal(false);
  saving = signal(false);
  error = signal<string | null>(null);
  safes = signal<MoneySafeOption[]>([]);

  private auditorId = 0;
  private shiftId: number | null = null;

  form = this.fb.nonNullable.group({
    expense_type_id: [0, [Validators.min(1)]],
    money_safe_id: [0, [Validators.min(1)]],
    amount: [0, [Validators.required, Validators.min(0)]],
    amount_currency: [0, [Validators.min(0)]],
    notes: ['', [Validators.maxLength(2000)]],
    date: [today(), [Validators.required]],
    project_id: [0],
    has_car: [false],
    car_id: [0],
    oil_start_km: [null as number | null, [Validators.min(0)]],
    oil_end_km: [null as number | null, [Validators.min(0)]],
    gas_current_km: [null as number | null, [Validators.min(0)]],
    gas_litres_count: [null as number | null, [Validators.min(0)]],
  });

  get isMulti() {
    return this.safes().find(s => s.id === this.form.controls.money_safe_id.value)?.is_multi_currency ?? false;
  }
  get hasCar() { return this.form.controls.has_car.value; }

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
      next: e => {
        const d = e.data;
        this.form.patchValue({
          expense_type_id: e.expense_type_id,
          money_safe_id: e.money_safe_id,
          amount: e.amount,
          date: e.date.slice(0, 10),
          amount_currency: e.amount_currency,
          notes: e.notes ?? '',
          project_id: e.project_id ?? 0,
          has_car: !!d,
          car_id: d?.car_id ?? 0,
          oil_start_km: d?.oil_start_km ?? null,
          oil_end_km: d?.oil_end_km ?? null,
          gas_current_km: d?.gas_current_km ?? null,
          gas_litres_count: d?.gas_litres_count ?? null,
        });
        this.auditorId = e.auditor_id;
        this.shiftId = e.shift_id ?? null;
        this.loading.set(false);
      },
      error: err => { this.error.set(apiError(err, 'فشل تحميل المصروف')); this.loading.set(false); },
    });
  }

  save() {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    if (!this.auditorId) { this.error.set('تعذر تحديد الموظف الحالي، سجل الدخول مرة اخرى'); return; }

    const v = this.form.getRawValue();
    const cur = this.isMulti ? v.amount_currency : 0;

    if (v.amount <= 0 && cur <= 0) {
      this.error.set('ادخل مبلغا (او مبلغا بالعملة لخزينة متعددة العملات)');
      return;
    }

    let data: ExpenseData | null = null;
    if (v.has_car) {
      const d: ExpenseData = {
        car_id: v.car_id || null,
        oil_start_km: numOrNull(v.oil_start_km),
        oil_end_km: numOrNull(v.oil_end_km),
        gas_current_km: numOrNull(v.gas_current_km),
        gas_litres_count: numOrNull(v.gas_litres_count),
      };
      if (!d.car_id) { this.error.set('اختر السيارة'); return; }
      if (d.oil_start_km != null && d.oil_end_km != null && d.oil_end_km < d.oil_start_km) {
        this.error.set('عداد نهاية الزيت لا يمكن ان يكون اقل من البداية');
        return;
      }
      if (d.gas_litres_count != null && d.gas_litres_count <= 0) {
        this.error.set('عدد لترات البنزين يجب ان يكون اكبر من صفر');
        return;
      }
      data = d;
    }

    this.saving.set(true);
    this.error.set(null);

    const payload: SaveExpense = {
      id: this.id() ?? 0,
      expense_type_id: v.expense_type_id,
      amount: v.amount,
      date: v.date,
      amount_currency: cur,
      notes: v.notes,
      data,
      shift_id: this.shiftId,
      money_safe_id: v.money_safe_id,
      auditor_id: this.auditorId,
      project_id: v.project_id || null,
    };

    const request$: Observable<unknown> = this.id()
      ? this.service.update(this.id()!, payload)
      : this.service.create(payload);

    request$.subscribe({
      next: () => this.router.navigate(['/expenses']),
      error: err => { this.error.set(apiError(err, 'فشل حفظ المصروف')); this.saving.set(false); },
    });
  }

  invalid(name: string) {
    const c = this.form.get(name);
    return !!c && c.invalid && (c.touched || c.dirty);
  }
}