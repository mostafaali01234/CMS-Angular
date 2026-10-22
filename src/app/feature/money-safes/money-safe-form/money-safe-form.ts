// money-safe-form/money-safe-form.ts
import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Observable } from 'rxjs';
import { MoneySafeService } from '../money-safe.service';
import { SaveMoneySafe } from '../money-safe.model';
import { LookupService } from '../../../shared/services/lookup.service';
import { activeOnly } from '../../../shared/models/lookup.model';
import { LookupSelect } from '../../../shared/components/lookup-select/lookup-select';
import { apiError } from '../../../shared/utils/api';

@Component({
  selector: 'app-money-safe-form',
  imports: [ReactiveFormsModule, RouterLink, LookupSelect],
  templateUrl: './money-safe-form.html',
})
export class MoneySafeForm implements OnInit {
  private fb = inject(FormBuilder);
  private service = inject(MoneySafeService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  lookup = inject(LookupService);
  activeOnly = activeOnly;

  id = signal<number | null>(null);
  loading = signal(false);
  saving = signal(false);
  error = signal<string | null>(null);

  form = this.fb.nonNullable.group({
    cod: [0, [Validators.required, Validators.min(1)]],
    name: ['', [Validators.required, Validators.maxLength(150)]],
    type_id: [0],
    category_id: [0],
    manager_id: [0],
    opening_balance: [0, [Validators.required]],
    is_multi_currency: [false],
    opening_balance_currency: [0],
    active: [true],
    notes: ['', [Validators.maxLength(2000)]],
  });

  ngOnInit() {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (!idParam) return;

    this.id.set(+idParam);
    this.loading.set(true);
    this.service.getById(+idParam).subscribe({
      next: s => {
        this.form.patchValue({
          cod: s.cod,
          name: s.name,
          type_id: s.type_id ?? 0,
          category_id: s.category_id ?? 0,
          manager_id: s.manager_id ?? 0,
          opening_balance: s.opening_balance,
          is_multi_currency: s.is_multi_currency,
          opening_balance_currency: s.opening_balance_currency,
          active: s.active,
          notes: s.notes ?? '',
        });
        this.loading.set(false);
      },
      error: err => {
        this.error.set(apiError(err, 'فشل تحميل الخزينة'));
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

    const v = this.form.getRawValue();
    const payload: SaveMoneySafe = {
      id: this.id() ?? 0,
      cod: v.cod,
      name: v.name,
      notes: v.notes,
      active: v.active,
      is_multi_currency: v.is_multi_currency,
      opening_balance: v.opening_balance,
      opening_balance_currency: v.is_multi_currency ? v.opening_balance_currency : 0,
      manager_id: v.manager_id || null,
      category_id: v.category_id || null,
      type_id: v.type_id || null,
    };

    const request$: Observable<unknown> = this.id()
      ? this.service.update(this.id()!, payload)
      : this.service.create(payload);

    request$.subscribe({
      next: () => this.router.navigate(['/money-safes']),
      error: err => {
        this.error.set(apiError(err, 'فشل حفظ الخزينة'));
        this.saving.set(false);
      },
    });
  }

  invalid(name: string) {
    const c = this.form.get(name);
    return !!c && c.invalid && (c.touched || c.dirty);
  }
}