// store-form/store-form.ts
import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Observable } from 'rxjs';
import { StoreService } from '../store.service';
import { SaveStore } from '../store.model';
import { LookupService } from '../../../shared/services/lookup.service';
import { activeOnly } from '../../../shared/models/lookup.model';
import { LookupSelect } from '../../../shared/components/lookup-select/lookup-select';
import { apiError } from '../../../shared/utils/api';

@Component({
  selector: 'app-store-form',
  imports: [ReactiveFormsModule, RouterLink, LookupSelect],
  templateUrl: './store-form.html',
})
export class StoreForm implements OnInit {
  private fb = inject(FormBuilder);
  private service = inject(StoreService);
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
    manager_id: [0, [Validators.min(1)]],                 // 0 = no selection
    phone: ['', [Validators.required, Validators.pattern(/^[0-9+\-\s()]{6,20}$/)]],
    city_id: [0, [Validators.min(1)]],
    address: ['', [Validators.required, Validators.maxLength(250)]],
    notes: ['', [Validators.maxLength(2000)]],
    active: [true],
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
          manager_id: s.manager_id,
          phone: s.phone,
          city_id: s.city_id,
          address: s.address,
          notes: s.notes ?? '',
          active: s.active,
        });
        this.loading.set(false);
      },
      error: err => {
        this.error.set(apiError(err, 'فشل تحميل المخزن'));
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

    const payload: SaveStore = { id: this.id() ?? 0, ...this.form.getRawValue() };

    const request$: Observable<unknown> = this.id()
      ? this.service.update(this.id()!, payload)
      : this.service.create(payload);

    request$.subscribe({
      next: () => this.router.navigate(['/stores']),
      error: err => {
        this.error.set(apiError(err, 'فشل حفظ المخزن'));
        this.saving.set(false);
      },
    });
  }

  invalid(name: string) {
    const c = this.form.get(name);
    return !!c && c.invalid && (c.touched || c.dirty);
  }
}