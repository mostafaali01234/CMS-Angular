// employee-form/employee-form.ts
import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ReactiveFormsModule, Validators, FormBuilder } from '@angular/forms';
import { Observable } from 'rxjs';
import { EmployeeService } from '../employee.service';
import { enumValue, MARTIAL_STATUSES, MILITARY_STATUSES, SaveEmployee } from '../employee.model';
import { LookupService } from '../../../shared/services/lookup.service';
import { LookupSelect } from '../../../shared/components/lookup-select/lookup-select';
import { StateCitySelect } from '../../../shared/components/state-city-select/state-city-select';
import { today } from '../../../shared/utils/date';
import { apiError } from '../../../shared/utils/api';

@Component({
  selector: 'app-employee-form',
  imports: [ReactiveFormsModule, RouterLink, LookupSelect, StateCitySelect],
  templateUrl: './employee-form.html',
})
export class EmployeeForm implements OnInit {
  private fb = inject(FormBuilder);
  private service = inject(EmployeeService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  lookup = inject(LookupService);

  militaryStatuses = MILITARY_STATUSES;
  martialStatuses = MARTIAL_STATUSES;

  id = signal<number | null>(null);
  loading = signal(false);
  saving = signal(false);
  error = signal<string | null>(null);

  // not editable here, but the server overwrites it on update, so it must go back unchanged
  private userId: string | null = null;

  form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(150)]],
    job_id: [0, [Validators.min(1)]],
    department_id: [0],
    city_id: [0, [Validators.min(1)]],
    salary: [0, [Validators.required, Validators.min(0)]],
    opening_balance: [0, [Validators.required, Validators.min(0)]],
    hire_date: [today(), [Validators.required]],
    birth_date: [''],
    active: [true],
    identification_number: ['', [Validators.maxLength(50)]],
    personal_phone: ['', [Validators.pattern(/^[0-9+\-\s()]{6,20}$/)]],
    work_phone: ['', [Validators.pattern(/^[0-9+\-\s()]{6,20}$/)]],
    military_status: [0],
    martial_status: [0],
    kids_count: [null as number | null, [Validators.min(0)]],
    education: ['', [Validators.maxLength(150)]],
    education_spec: ['', [Validators.maxLength(150)]],
    additional_address: ['', [Validators.maxLength(250)]],
    notes: ['', [Validators.maxLength(2000)]],
  });

  ngOnInit() {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (!idParam) return;

    this.id.set(+idParam);
    this.loading.set(true);
    this.service.getById(+idParam).subscribe({
      next: e => {
        this.userId = e.user_id || null;
        this.form.patchValue({
          ...e,
          hire_date: e.hire_date?.slice(0, 10) ?? '',
          birth_date: e.birth_date?.slice(0, 10) ?? '',
          department_id: e.department_id ?? 0,
          kids_count: e.kids_count ?? null,
          military_status: enumValue(MILITARY_STATUSES, e.military_status),
          martial_status: enumValue(MARTIAL_STATUSES, e.martial_status),
        });        this.loading.set(false);
      },
      error: err => { this.error.set(apiError(err, 'فشل تحميل الموظف')); this.loading.set(false); },
    });
  }

  save() {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }

    const v = this.form.getRawValue();
    this.saving.set(true);
    this.error.set(null);

    const payload: SaveEmployee = {
      ...v,
      id: this.id() ?? 0,
      department_id: v.department_id > 0 ? v.department_id : null,
      birth_date: v.birth_date || null,
      user_id: this.userId,
      martial_status: v.martial_status,
      military_status: v.military_status,
    };

    const request$: Observable<unknown> = this.id()
      ? this.service.update(this.id()!, payload)
      : this.service.create(payload);

    request$.subscribe({
      next: () => this.router.navigate(['/employees']),
      error: err => { this.error.set(apiError(err, 'فشل حفظ الموظف')); this.saving.set(false); },
    });
  }

  invalid(name: string) {
    const c = this.form.get(name);
    return !!c && c.invalid && (c.touched || c.dirty);
  }
}