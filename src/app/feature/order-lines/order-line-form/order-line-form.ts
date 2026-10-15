// order-line-form/order-line-form.ts
import { Component, inject, OnInit, signal, WritableSignal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { forkJoin, map, Observable, of, switchMap } from 'rxjs';
import { OrderLineService } from '../order-line.service';
import { OrderLine, SaveOrderLine } from '../order-line.model';
import { LookupService } from '../../../shared/services/lookup.service';
import { activeOnly, LookupItem } from '../../../shared/models/lookup.model';
import { LookupSelect } from '../../../shared/components/lookup-select/lookup-select';
import { apiError } from '../../../shared/utils/api';

@Component({
    selector: 'app-order-line-form',
    imports: [ReactiveFormsModule, RouterLink, LookupSelect],
    templateUrl: './order-line-form.html',
})
export class OrderLineForm implements OnInit {
    private fb = inject(FormBuilder);
    private service = inject(OrderLineService);
    private route = inject(ActivatedRoute);
    private router = inject(Router);

    lookup = inject(LookupService);
    activeOnly = activeOnly;

    id = signal<number | null>(null);
    loading = signal(false);
    saving = signal(false);
    error = signal<string | null>(null);

    cities = signal<LookupItem[]>([]);
    categories = signal<LookupItem[]>([]);
    selectedCities = signal<number[]>([]);
    selectedCategories = signal<number[]>([]);

    private originalCities: number[] = [];
    private originalCategories: number[] = [];

    form = this.fb.nonNullable.group({
        name: ['', [Validators.required]],
        notes: [''],
        managerId: [0, [Validators.min(1)]],   // 0 = no selection in app-lookup-select
    });

    ngOnInit() {
        this.lookup.getCities().subscribe(c => this.cities.set(c));
        this.lookup.productCategories().subscribe(c => this.categories.set(c));

        const idParam = this.route.snapshot.paramMap.get('id');
        if (!idParam) return;

        this.id.set(+idParam);
        this.loading.set(true);
        this.service.getById(+idParam).subscribe({
            next: l => {
                this.form.patchValue({
                    name: l.name,
                    notes: l.notes ?? '',
                    managerId: l.manager_id,
                });
                this.originalCities = (l.cities ?? []).map(c => c.id);
                this.originalCategories = (l.productCategories ?? []).map(c => c.id);
                this.selectedCities.set([...this.originalCities]);
                this.selectedCategories.set([...this.originalCategories]);
                this.loading.set(false);
            },
            error: err => {
                this.error.set(apiError(err, 'فشل تحميل خط الطلب'));
                this.loading.set(false);
            },
        });
    }

    toggle(list: WritableSignal<number[]>, id: number) {
        list.update(ids => (ids.includes(id) ? ids.filter(x => x !== id) : [...ids, id]));
    }

    // order-line-form.ts: save() becomes a single call
    save() {
        if (this.form.invalid) {
            this.form.markAllAsTouched();
            return;
        }

        this.saving.set(true);
        this.error.set(null);

        const v = this.form.getRawValue();
        const payload: SaveOrderLine = {
            name: v.name,
            notes: v.notes,
            manager_id: v.managerId,
            city_ids: this.selectedCities(),
            category_ids: this.selectedCategories(),
        };

        const request$: Observable<unknown> = this.id()
            ? this.service.update(this.id()!, payload)
            : this.service.create(payload);

        request$.subscribe({
            next: () => this.router.navigate(['/order-lines']),
            error: err => {
                this.error.set(apiError(err, 'فشل حفظ خط الطلب'));
                this.saving.set(false);
            },
        });
    }

    invalid(name: string) {
        const c = this.form.get(name);
        return !!c && c.invalid && (c.touched || c.dirty);
    }
}