// sales-manager-form/sales-manager-form.ts
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { forkJoin, Observable } from 'rxjs';
import { SalesManagerService } from '../sales-manager.service';
import { LookupService } from '../../../shared/services/lookup.service';
import { activeOnly, ProductOption } from '../../../shared/models/lookup.model';
import { SearchSelect } from '../../../shared/components/search-select/search-select';
import { apiError } from '../../../shared/utils/api';

interface Option { id: number; name: string; }

@Component({
  selector: 'app-sales-manager-form',
  imports: [FormsModule, RouterLink, SearchSelect],
  templateUrl: './sales-manager-form.html',
})
export class SalesManagerForm implements OnInit {
  private service = inject(SalesManagerService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  lookup = inject(LookupService);

  activeOnly = activeOnly;
  productText = (p: ProductOption) => (p.barcode ? `${p.name} - ${p.barcode}` : p.name);

  id = signal<number | null>(null);
  loading = signal(false);
  saving = signal(false);
  error = signal<string | null>(null);

  employees = signal<Option[]>([]);
  products = signal<Option[]>([]);

  managerId = signal(0);
  percent = signal(0);
  active = signal(true);
  notes = signal('');
  sellerIds = signal<number[]>([]);
  productIds = signal<number[]>([]);
  pickSeller = signal(0);
  pickProduct = signal(0);

  freeEmployees = computed(() =>
    this.employees().filter(e => e.id !== this.managerId() && !this.sellerIds().includes(e.id)));
  sellers = computed(() => this.sellerIds().map(id => ({ id, name: this.employees().find(e => e.id === id)?.name ?? '#' + id })));
  chosenProducts = computed(() => this.productIds().map(id => ({ id, name: this.products().find(p => p.id === id)?.name ?? '#' + id })));

  ngOnInit() {
    const idParam = this.route.snapshot.paramMap.get('id');
    this.loading.set(true);
    forkJoin({ employees: this.lookup.employees(), products: this.lookup.products() }).subscribe({
      next: r => {
        this.employees.set(r.employees);
        this.products.set(r.products);
        if (!idParam) { this.loading.set(false); return; }

        this.id.set(+idParam);
        this.service.getById(+idParam).subscribe({
          next: g => {
            this.managerId.set(g.manager_id); this.percent.set(g.percent);
            this.active.set(g.active); this.notes.set(g.notes ?? '');
            this.sellerIds.set(g.sellers.map(s => s.id));
            this.productIds.set(g.products.map(p => p.id));
            this.loading.set(false);
          },
          error: err => { this.error.set(apiError(err, 'فشل تحميل المجموعة')); this.loading.set(false); },
        });
      },
      error: err => { this.error.set(apiError(err, 'فشل تحميل القوائم')); this.loading.set(false); },
    });
  }

  addSeller() {
    const id = this.pickSeller();
    if (id > 0 && !this.sellerIds().includes(id)) this.sellerIds.update(a => [...a, id]);
    this.pickSeller.set(0);
  }
  removeSeller(id: number) { this.sellerIds.update(a => a.filter(x => x !== id)); }

  addProduct(id: number) {
    if (id > 0 && !this.productIds().includes(id)) this.productIds.update(a => [...a, id]);
    this.pickProduct.set(id);
    queueMicrotask(() => this.pickProduct.set(0));      // clear the picker so the next product can be chosen
  }
  removeProduct(id: number) { this.productIds.update(a => a.filter(x => x !== id)); }

  save() {
    if (!this.managerId()) return this.error.set('اختر المدير');
    if (this.percent() <= 0 || this.percent() > 100) return this.error.set('النسبة يجب ان تكون بين 0 و 100');
    if (this.sellerIds().length === 0) return this.error.set('أضف بائعا واحدا على الأقل');
    if (this.productIds().length === 0) return this.error.set('أضف منتجا واحدا على الأقل');

    const body = {
      id: this.id() ?? 0, manager_id: this.managerId(), percent: this.percent(),
      active: this.active(), notes: this.notes(),
      sellers: this.sellerIds().map(id => ({ id, name: '' })),
      products: this.productIds().map(id => ({ id, name: '' })),
    };
    this.saving.set(true); this.error.set(null);
    const req$: Observable<unknown> = this.id()
      ? this.service.update(this.id()!, body)
      : this.service.create(body);

    req$.subscribe({
      next: () => this.router.navigate(['/sales-managers']),
      error: err => { this.error.set(apiError(err, 'فشل الحفظ')); this.saving.set(false); },
    });
  }
}