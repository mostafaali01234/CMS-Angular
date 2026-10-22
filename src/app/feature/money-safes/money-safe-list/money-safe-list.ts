// money-safe-list/money-safe-list.ts
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MoneySafeService } from '../money-safe.service';
import { MoneySafe } from '../money-safe.model';
import { ConfirmService } from '../../../shared/services/confirm.service';
import { LookupService } from '../../../shared/services/lookup.service';
import { MoneySafeCategoryOption, MoneySafeTypeOption } from '../../../shared/models/lookup.model';
import { apiError } from '../../../shared/utils/api';

type ActiveFilter = 'all' | 'active' | 'inactive';

interface SafeGroup {
  key: number;          // category id, 0 = no category
  name: string;
  items: MoneySafe[];
  total: number;
  totalCurrency: number;
}

const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

@Component({
  selector: 'app-money-safe-list',
  imports: [RouterLink, FormsModule, DecimalPipe],
  templateUrl: './money-safe-list.html',
})
export class MoneySafeList implements OnInit {
  private service = inject(MoneySafeService);
  private confirm = inject(ConfirmService);
  private lookup = inject(LookupService);

  safes = signal<MoneySafe[]>([]);
  types = signal<MoneySafeTypeOption[]>([]);
  categories = signal<MoneySafeCategoryOption[]>([]);   // only used to order the groups
  typesReady = signal(false);

  search = signal('');
  typeId = signal(0);
  activeFilter = signal<ActiveFilter>('all');

  loading = signal(true);
  error = signal<string | null>(null);
  actionError = signal<string | null>(null);
  deletingId = signal<number | null>(null);

  defaultTypeId = computed(() => this.types()[0]?.id ?? 0);
  selectedTypeName = computed(() => this.types().find(t => t.id === this.typeId())?.name ?? '');

  filtered = computed(() => {
    const q = this.search().trim().toLowerCase();
    const type = this.typeId();
    const act = this.activeFilter();

    return this.safes().filter(s => {
      if (type && s.type_id !== type) return false;
      if (act === 'active' && !s.active) return false;
      if (act === 'inactive' && s.active) return false;
      if (!q) return true;
      return (
        String(s.cod) === q ||
        [s.name, s.manager_name, s.category_name, s.notes]
          .some(v => (v ?? '').toLowerCase().includes(q))
      );
    });
  });

  groups = computed<SafeGroup[]>(() => {
    const map = new Map<number, SafeGroup>();
    for (const s of this.filtered()) {
      const key = s.category_id ?? 0;
      let g = map.get(key);
      if (!g) {
        g = { key, name: s.category_name || 'بدون تصنيف', items: [], total: 0, totalCurrency: 0 };
        map.set(key, g);
      }
      g.items.push(s);
    }

    // the category lookup is already sorted by order number
    const rank = new Map(this.categories().map((c, i) => [c.id, i]));
    const list = [...map.values()];

    list.forEach(g => {
      g.items.sort((a, b) => a.cod - b.cod);
      g.total = round2(g.items.reduce((sum, x) => sum + (x.balance ?? 0), 0));
      g.totalCurrency = round2(g.items.reduce((sum, x) => sum + (x.balance_currency ?? 0), 0));
    });

    return list.sort((a, b) =>
      (a.key === 0 ? 1 : 0) - (b.key === 0 ? 1 : 0) ||        // "no category" last
      (rank.get(a.key) ?? 999) - (rank.get(b.key) ?? 999) ||
      a.name.localeCompare(b.name, 'ar'));
  });

  grandTotal = computed(() => round2(this.groups().reduce((s, g) => s + g.total, 0)));
  grandTotalCurrency = computed(() => round2(this.groups().reduce((s, g) => s + g.totalCurrency, 0)));

  ngOnInit() {
    this.load();
    this.lookup.moneySafeCategories().subscribe({ next: c => this.categories.set(c) });
    this.lookup.moneySafeTypes().subscribe({
      next: t => {
        this.types.set(t);
        this.typeId.set(t[0]?.id ?? 0);       // first type is the default
        this.typesReady.set(true);
      },
      error: () => this.typesReady.set(true), // no types: the list shows everything
    });
  }

  load() {
    this.loading.set(true);
    this.error.set(null);
    this.service.getAll().subscribe({
      next: data => { this.safes.set(data); this.loading.set(false); },
      error: err => {
        this.error.set(apiError(err, 'فشل تحميل الخزائن'));
        this.loading.set(false);
      },
    });
  }

  clearFilters() {
    this.search.set('');
    this.typeId.set(this.defaultTypeId());
    this.activeFilter.set('all');
  }

  async remove(s: MoneySafe) {
    const ok = await this.confirm.confirm({
      title: 'حذف خزينة',
      message: `هل أنت متأكد من حذف الخزينة "${s.name}"؟ لا يمكن التراجع عن هذا الإجراء.`,
      confirmText: 'حذف',
      danger: true,
    });
    if (!ok) return;

    this.actionError.set(null);
    this.deletingId.set(s.id);
    this.service.delete(s.id).subscribe({
      next: () => {
        this.safes.update(list => list.filter(x => x.id !== s.id));
        this.deletingId.set(null);
      },
      error: err => {
        this.actionError.set(apiError(err, 'فشل حذف الخزينة'));
        this.deletingId.set(null);
      },
    });
  }
}