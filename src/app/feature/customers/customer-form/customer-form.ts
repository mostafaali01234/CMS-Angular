// customer-form/customer-form.ts
import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CustomerService } from '../customer.service';
import { Customer } from '../customer.model';
import { Observable } from 'rxjs';
import { AuthService } from '../../../services/auth/AuthService/auth';
import { StateCitySelect } from '../../../shared/components/state-city-select/state-city-select';
import { apiError } from '../../../shared/utils/api';
import { EmployeeSelect } from '../../../shared/components/employee-select/employee-select';


@Component({
  selector: 'app-customer-form',
  imports: [ReactiveFormsModule, RouterLink, StateCitySelect, EmployeeSelect],
  templateUrl: './customer-form.html',
})
export class CustomerForm implements OnInit {
  auth = inject(AuthService);
  private fb = inject(FormBuilder);
  private service = inject(CustomerService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  id = signal<number | null>(null);
  loading = signal(false);
  saving = signal(false);
  error = signal<string | null>(null);

  form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(200)]],
    phone: ['', [Validators.required]],
    phone_2: [''],
    phone_3: [''],
    city_id: [0, [Validators.required, Validators.min(1)]],
    state_id:[0],
    address: [''],
    notes: [''],
    opening_balance: [0, [Validators.required]],
    seller_id: [0, [Validators.required, Validators.min(1)]],
    regular_customer: [false],
  });

  ngOnInit() {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (!idParam) { this.loading.set(false); return; }

    this.id.set(+idParam);
    this.service.getById(+idParam).subscribe({
        next: customer => {
        this.form.patchValue({
            name: customer.name,
            phone: customer.phone,
            phone_2: customer.phone_2 ?? '',
            phone_3: customer.phone_3 ?? '',
            city_id: customer.city_id,   // component derives the state itself
            address: customer.address ?? '',
            notes: customer.notes ?? '',
            opening_balance: customer.opening_balance,
            seller_id: customer.seller_id,
            regular_customer: customer.regular_customer ?? false,
        });
        this.loading.set(false);
        },
        error: () => {
        this.error.set('فشل تحميل البيانات');
        this.loading.set(false);
        },
    });
    }

  save() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving.set(true);
    this.error.set(null);

    const payload = { id: this.id() ?? 0, ...this.form.getRawValue() } as Customer;
    const request$: Observable<unknown> = this.id()
    ? this.service.update(this.id()!, payload)
    : this.service.create(payload);

    request$.subscribe({
    next: () => this.router.navigate(['/customers']),
    error: err => {
        this.error.set(apiError(err, 'فشل حفظ بيانات العميل'));
        this.saving.set(false);
    },
    });
  }

  invalid(name: string) {
    const c = this.form.get(name);
    return !!c && c.invalid && (c.touched || c.dirty);
  }
}