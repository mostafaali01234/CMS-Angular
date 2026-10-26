// supplier-form/supplier-form.ts
import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Observable } from 'rxjs';
import { SupplierService } from '../supplier.service';
import { SaveSupplier } from '../supplier.model';
import { LookupService } from '../../../shared/services/lookup.service';
import { LookupSelect } from '../../../shared/components/lookup-select/lookup-select';
import { apiError } from '../../../shared/utils/api';

@Component({
  selector: 'app-supplier-form',
  imports: [ReactiveFormsModule, RouterLink, LookupSelect],
  templateUrl: './supplier-form.html',
})
export class SupplierForm implements OnInit {
  private fb = inject(FormBuilder);
  private service = inject(SupplierService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  lookup = inject(LookupService);

  id = signal<number | null>(null);
  loading = signal(false);
  saving = signal(false);
  error = signal<string | null>(null);

  form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(150)]],
    name_en: ['', [Validators.maxLength(150)]],
    phone: ['', [Validators.pattern(/^$|^[0-9+\-\s()]{6,20}$/)]],
    email: ['', [Validators.maxLength(150), Validators.pattern(/^$|^[^@\s]+@[^@\s]+\.[^@\s]+$/)]],
    city_id: [0, [Validators.min(1)]],                 // 0 = no selection
    address: ['', [Validators.maxLength(250)]],
    tax_card: ['', [Validators.maxLength(50)]],
    commercial_register: ['', [Validators.maxLength(50)]],
    openingBalance: [0, [Validators.required]],
    fixedDiscount: [0, [Validators.required, Validators.min(0), Validators.max(100)]],
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
          name: s.name,
          name_en: s.name_en ?? '',
          phone: s.phone ?? '',
          email: s.email ?? '',
          city_id: s.city_id,
          address: s.address ?? '',
          tax_card: s.tax_card ?? '',
          commercial_register: s.commercial_register ?? '',
          openingBalance: s.openingBalance,
          fixedDiscount: s.fixedDiscount,
          notes: s.notes ?? '',
        });
        this.loading.set(false);
      },
      error: err => {
        this.error.set(apiError(err, 'فشل تحميل المورد'));
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

    const payload: SaveSupplier = { id: this.id() ?? 0, ...this.form.getRawValue() };

    const request$: Observable<unknown> = this.id()
      ? this.service.update(this.id()!, payload)
      : this.service.create(payload);

    request$.subscribe({
      next: () => this.router.navigate(['/suppliers']),
      error: err => {
        this.error.set(apiError(err, 'فشل حفظ المورد'));
        this.saving.set(false);
      },
    });
  }

  invalid(name: string) {
    const c = this.form.get(name);
    return !!c && c.invalid && (c.touched || c.dirty);
  }
}