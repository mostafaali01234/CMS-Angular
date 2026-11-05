// employee-loan-form/employee-loan-form.ts
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { DatePipe, DecimalPipe } from '@angular/common';
import { Observable } from 'rxjs';
import { EmployeeLoanService } from '../employee-loan.service';
import { installmentStatus, Loan, LoanInstallment, SaveLoan, STATUS_LABELS } from '../employee-loan.model';
import { LookupService } from '../../../shared/services/lookup.service';
import { activeOnly } from '../../../shared/models/lookup.model';
import { LookupSelect } from '../../../shared/components/lookup-select/lookup-select';
import { today } from '../../../shared/utils/date';
import { apiError } from '../../../shared/utils/api';
import { AuthService } from '../../../core/services/AuthService/auth';

@Component({
  selector: 'app-employee-loan-form',
  imports: [ReactiveFormsModule, RouterLink, DatePipe, DecimalPipe, LookupSelect],
  templateUrl: './employee-loan-form.html',
})
export class EmployeeLoanForm implements OnInit {
  private fb = inject(FormBuilder);
  private service = inject(EmployeeLoanService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  lookup = inject(LookupService);
  activeOnly = activeOnly;
  private auth = inject(AuthService);
  private approvedById = 0;

  statusLabel = (s: number | string) => STATUS_LABELS[installmentStatus(s)];

  id = signal<number | null>(null);
  loading = signal(false);
  saving = signal(false);
  error = signal<string | null>(null);
  installments = signal<LoanInstallment[]>([]);

  // after any installment is deducted or skipped the server refuses edits
  locked = computed(() => this.installments().some(i => installmentStatus(i.status) !== 'Pending'));

  // not editable here, but update overwrites it, so it goes back unchanged
  private shiftId: number | null = null;

  form = this.fb.nonNullable.group({
    employee_id: [0, [Validators.min(1)]],
    amount: [0, [Validators.required, Validators.min(0.01)]],
    mode: ['installments' as 'installments' | 'safe'],
    money_safe_id: [0],
    installment_count: [1, [Validators.min(1), Validators.max(120)]],
    start_date: [today(), [Validators.required]],
    project_id: [0],
    notes: ['', [Validators.maxLength(2000)]],
  });

  isSafe = () => this.form.controls.mode.value === 'safe';

  /** the amount of one installment, shown as a hint */
  perInstallment = computed(() => null as number | null);

  ngOnInit() {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (!idParam) {
      this.approvedById = Number(this.auth.employeeId()) || 0;
      return;
    }

    this.id.set(+idParam);
    this.loading.set(true);
    this.service.getById(+idParam).subscribe({
      next: l => {
        this.approvedById = l.approved_by_id ?? (Number(this.auth.employeeId()) || 0);
        this.shiftId = l.shift_id ?? null;
        this.installments.set(l.installments ?? []);
        this.form.patchValue({
          employee_id: l.employee_id,
          // approved_by_id: l.approved_by_id ?? 0,
          amount: l.amount,
          mode: l.money_safe_id ? 'safe' : 'installments',
          money_safe_id: l.money_safe_id ?? 0,
          installment_count: l.installment_count || 1,
          start_date: l.start_date?.slice(0, 10) ?? '',
          project_id: l.project_id ?? 0,
          notes: l.notes ?? '',
        });
        if (this.locked()) this.form.disable();
        this.loading.set(false);

      },
      error: err => { this.error.set(apiError(err, 'فشل تحميل السلفة')); this.loading.set(false); },
    });
  }

  save() {
    if (this.locked()) return;
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    if (!this.approvedById) { this.error.set('تعذر تحديد الموظف الحالي، سجل الدخول مرة اخرى'); return; }

    const v = this.form.getRawValue();
    const safe = v.mode === 'safe';
    if (safe && v.money_safe_id <= 0) { this.error.set('اختر الخزنة'); return; }
    if (!safe && (!v.installment_count || v.installment_count < 1)) { this.error.set('ادخل عدد الاقساط'); return; }

    this.saving.set(true);
    this.error.set(null);

    const payload: SaveLoan = {
      id: this.id() ?? 0,
      employee_id: v.employee_id,
      approved_by_id: this.approvedById,
      amount: v.amount,
      money_safe_id: safe ? v.money_safe_id : null,
      installment_count: safe ? 0 : v.installment_count,
      start_date: v.start_date,
      notes: v.notes,
      project_id: v.project_id > 0 ? v.project_id : null,
      shift_id: this.shiftId,
    };

    const request$: Observable<unknown> = this.id()
      ? this.service.update(this.id()!, payload)
      : this.service.create(payload);

    request$.subscribe({
      next: () => this.router.navigate(['/employee-loans']),
      error: err => { this.error.set(apiError(err, 'فشل حفظ السلفة')); this.saving.set(false); },
    });
  }

  invalid(name: string) {
    const c = this.form.get(name);
    return !!c && c.invalid && (c.touched || c.dirty);
  }
}