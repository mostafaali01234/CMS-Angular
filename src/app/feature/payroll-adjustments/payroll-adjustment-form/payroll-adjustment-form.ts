// payroll-adjustment-form/payroll-adjustment-form.ts
import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Observable } from 'rxjs';
import { PayrollAdjustmentService } from '../payroll-adjustment.service';
import { ADDITION_TYPES, DEDUCTION_TYPES, kindOfType, SaveAdjustment, typeValue } from '../payroll-adjustment.model';
import { LookupService } from '../../../shared/services/lookup.service';
import { LookupSelect } from '../../../shared/components/lookup-select/lookup-select';
import { AuthService } from '../../../core/services/AuthService/auth'; 
import { today } from '../../../shared/utils/date';
import { apiError } from '../../../shared/utils/api';

@Component({
  selector: 'app-payroll-adjustment-form',
  imports: [ReactiveFormsModule, RouterLink, LookupSelect],
  templateUrl: './payroll-adjustment-form.html',
})
export class PayrollAdjustmentForm implements OnInit {
  private fb = inject(FormBuilder);
  private service = inject(PayrollAdjustmentService);
  private auth = inject(AuthService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  lookup = inject(LookupService);

  deductionTypes = DEDUCTION_TYPES;
  additionTypes = ADDITION_TYPES;

  id = signal<number | null>(null);
  loading = signal(false);
  saving = signal(false);
  error = signal<string | null>(null);

  // the logged-in employee on create, the stored one on edit
  private approvedById = 0;

  form = this.fb.nonNullable.group({
    employee_id: [0, [Validators.min(1)]],
    operation_date: [today(), [Validators.required]],
    type: [0, [Validators.min(1)]],
    amount: [0, [Validators.required, Validators.min(0.01)]],
    reason: ['', [Validators.required, Validators.maxLength(2000)]],
  });

  kind = () => kindOfType(+this.form.controls.type.value);

  ngOnInit() {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (!idParam) {
      this.approvedById = Number(this.auth.employeeId()) || 0;
      return;
    }

    this.id.set(+idParam);
    this.loading.set(true);
    this.service.getById(+idParam).subscribe({
      next: a => {
        this.approvedById = a.approved_by_id ?? (Number(this.auth.employeeId()) || 0);
        this.form.patchValue({
          employee_id: a.employee_id,
          operation_date: a.operation_date?.slice(0, 10) ?? '',
          type: typeValue(a.type),
          amount: a.amount,
          reason: a.reason ?? '',
        });
        this.loading.set(false);
      },
      error: err => { this.error.set(apiError(err, 'فشل التحميل')); this.loading.set(false); },
    });
  }

  save() {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    if (!this.approvedById) { this.error.set('تعذر تحديد الموظف الحالي، سجل الدخول مرة اخرى'); return; }

    const v = this.form.getRawValue();
    this.saving.set(true);
    this.error.set(null);

    const payload: SaveAdjustment = {
      id: this.id() ?? 0,
      employee_id: v.employee_id,
      operation_date: v.operation_date,
      type: +v.type,
      kind: kindOfType(+v.type),       // the server sets it from the type anyway
      amount: v.amount,
      reason: v.reason.trim(),
      approved_by_id: this.approvedById,
    };

    const request$: Observable<unknown> = this.id()
      ? this.service.update(this.id()!, payload)
      : this.service.create(payload);

    request$.subscribe({
      next: () => this.router.navigate(['/payroll-adjustments']),
      error: err => { this.error.set(apiError(err, 'فشل الحفظ')); this.saving.set(false); },
    });
  }

  invalid(name: string) {
    const c = this.form.get(name);
    return !!c && c.invalid && (c.touched || c.dirty);
  }
}