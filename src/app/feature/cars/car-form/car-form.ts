// car-form/car-form.ts
import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Observable } from 'rxjs';
import { CarService } from '../car.service';
import { SaveCar } from '../car.model';
import { LookupService } from '../../../shared/services/lookup.service';
import { activeOnly } from '../../../shared/models/lookup.model';
import { LookupSelect } from '../../../shared/components/lookup-select/lookup-select';
import { apiError } from '../../../shared/utils/api';

@Component({
  selector: 'app-car-form',
  imports: [ReactiveFormsModule, RouterLink, LookupSelect],
  templateUrl: './car-form.html',
})
export class CarForm implements OnInit {
  private fb = inject(FormBuilder);
  private service = inject(CarService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  lookup = inject(LookupService);
  activeOnly = activeOnly;

  id = signal<number | null>(null);
  loading = signal(false);
  saving = signal(false);
  error = signal<string | null>(null);

  form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(150)]],
    driver_id: [0, [Validators.min(1)]],
    plat_number: ['', [Validators.required, Validators.maxLength(50)]],
    model: ['', [Validators.required, Validators.maxLength(100)]],
    owner_name: ['', [Validators.required, Validators.maxLength(200)]],
    motor_number: ['', [Validators.required, Validators.maxLength(100)]],
    chassis_number: ['', [Validators.required, Validators.maxLength(100)]],
    oil_change_rate: [0, [Validators.required, Validators.min(0)]],
    filter_change_rate: [0, [Validators.required, Validators.min(0)]],
    sk_change_rate: [0, [Validators.required, Validators.min(0)]],
    tire_change_rate: [0, [Validators.required, Validators.min(0)]],
    license_start_date: ['', [Validators.required]],
    license_end_date: ['', [Validators.required]],
    insurance_start_date: ['', [Validators.required]],
    insurance_end_date: ['', [Validators.required]],
    insurance_company_name: ['', [Validators.required, Validators.maxLength(200)]],
    notes: ['', [Validators.maxLength(2000)]],
  });

  ngOnInit() {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (!idParam) return;

    this.id.set(+idParam);
    this.loading.set(true);
    this.service.getById(+idParam).subscribe({
      next: c => {
        this.form.patchValue({
          name: c.name,
          driver_id: c.driver_id,
          plat_number: c.plat_number,
          model: c.model,
          owner_name: c.owner_name,
          motor_number: c.motor_number,
          chassis_number: c.chassis_number,
          oil_change_rate: c.oil_change_rate,
          filter_change_rate: c.filter_change_rate,
          sk_change_rate: c.sk_change_rate,
          tire_change_rate: c.tire_change_rate,
          license_start_date: c.license_start_date.slice(0, 10),
          license_end_date: c.license_end_date.slice(0, 10),
          insurance_start_date: c.insurance_start_date.slice(0, 10),
          insurance_end_date: c.insurance_end_date.slice(0, 10),
          insurance_company_name: c.insurance_company_name,
          notes: c.notes ?? '',
        });
        this.loading.set(false);
      },
      error: err => { this.error.set(apiError(err, 'فشل تحميل السيارة')); this.loading.set(false); },
    });
  }

  save() {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }

    const v = this.form.getRawValue();
    if (v.license_end_date <= v.license_start_date) {
      this.error.set('نهاية الرخصة يجب ان تكون بعد بدايتها');
      return;
    }
    if (v.insurance_end_date <= v.insurance_start_date) {
      this.error.set('نهاية التأمين يجب ان تكون بعد بدايته');
      return;
    }

    this.saving.set(true);
    this.error.set(null);

    const payload: SaveCar = { id: this.id() ?? 0, ...v };

    const request$: Observable<unknown> = this.id()
      ? this.service.update(this.id()!, payload)
      : this.service.create(payload);

    request$.subscribe({
      next: () => this.router.navigate(['/cars']),
      error: err => { this.error.set(apiError(err, 'فشل حفظ السيارة')); this.saving.set(false); },
    });
  }

  invalid(name: string) {
    const c = this.form.get(name);
    return !!c && c.invalid && (c.touched || c.dirty);
  }
}