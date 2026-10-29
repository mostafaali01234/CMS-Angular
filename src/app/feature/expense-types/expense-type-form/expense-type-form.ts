// expense-type-form/expense-type-form.ts
import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Observable } from 'rxjs';
import { ExpenseTypeService } from '../expense-type.service';
import { ExpenseType } from '../expense-type.model';
import { apiError } from '../../../shared/utils/api';
import { LookupSelect } from '../../../shared/components/lookup-select/lookup-select';
import { LookupService } from '../../../shared/services/lookup.service';

@Component({
  selector: 'app-expense-type-form',
  imports: [ReactiveFormsModule, RouterLink, LookupSelect],
  templateUrl: './expense-type-form.html',
})
export class ExpenseTypeForm implements OnInit {
  private fb = inject(FormBuilder);
  private service = inject(ExpenseTypeService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  lookup = inject(LookupService);
  id = signal<number | null>(null);
  loading = signal(false);
  saving = signal(false);
  error = signal<string | null>(null);

  form = this.fb.nonNullable.group({
    name: ['', [Validators.required]],
    category_id: [0, [Validators.required]],
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
          category_id: c.category_id,
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

    const payload = { id: this.id() ?? 0, ...this.form.getRawValue() } as ExpenseType;

    const request$: Observable<unknown> = this.id()
      ? this.service.update(this.id()!, payload)
      : this.service.create(payload);

    request$.subscribe({
      next: () => this.router.navigate(['/expense-types']),
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