// money-safe-category-form/money-safe-category-form.ts
import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Observable } from 'rxjs';
import { MoneySafeCategoryService } from '../money-safe-category.service';
import { MoneySafeCategory } from '../money-safe-category.model';
import { apiError } from '../../../shared/utils/api';

@Component({
  selector: 'app-money-safe-category-form',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './money-safe-category-form.html',
})
export class MoneySafeCategoryForm implements OnInit {
  private fb = inject(FormBuilder);
  private service = inject(MoneySafeCategoryService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  id = signal<number | null>(null);
  loading = signal(false);
  saving = signal(false);
  error = signal<string | null>(null);

  form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(100)]],
    orderNumber: [0, [Validators.required, Validators.min(0)]],
    notes: [''],
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
          orderNumber: c.orderNumber,
          notes: c.notes ?? '',
        });
        this.loading.set(false);
      },
      error: err => {
        this.error.set(apiError(err, 'فشل تحميل التصنيف'));
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

    const payload: MoneySafeCategory = { id: this.id() ?? 0, ...this.form.getRawValue() };

    const request$: Observable<unknown> = this.id()
      ? this.service.update(this.id()!, payload)
      : this.service.create(payload);

    request$.subscribe({
      next: () => this.router.navigate(['/money-safe-categories']),
      error: err => {
        this.error.set(apiError(err, 'فشل حفظ التصنيف'));
        this.saving.set(false);
      },
    });
  }

  invalid(name: string) {
    const c = this.form.get(name);
    return !!c && c.invalid && (c.touched || c.dirty);
  }
}