// store-list/store-list.ts
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { StoreService } from '../store.service';
import { Store } from '../store.model';
import { ConfirmService } from '../../../shared/services/confirm.service';
import { apiError } from '../../../shared/utils/api';

type ActiveFilter = 'all' | 'active' | 'inactive';

@Component({
  selector: 'app-store-list',
  imports: [RouterLink, FormsModule],
  templateUrl: './store-list.html',
})
export class StoreList implements OnInit {
  private service = inject(StoreService);
  private confirm = inject(ConfirmService);

  stores = signal<Store[]>([]);
  search = signal('');
  activeFilter = signal<ActiveFilter>('all');
  loading = signal(true);
  error = signal<string | null>(null);
  actionError = signal<string | null>(null);
  deletingId = signal<number | null>(null);

  filtered = computed(() => {
    const q = this.search().trim().toLowerCase();
    const act = this.activeFilter();

    return this.stores().filter(s => {
      if (act === 'active' && !s.active) return false;
      if (act === 'inactive' && s.active) return false;
      if (!q) return true;
      return [s.name, s.phone, s.manager_name, s.city_name, s.address]
        .some(v => (v ?? '').toLowerCase().includes(q));
    });
  });

  ngOnInit() { this.load(); }

  load() {
    this.loading.set(true);
    this.error.set(null);
    this.service.getAll().subscribe({
      next: data => { this.stores.set(data); this.loading.set(false); },
      error: err => {
        this.error.set(apiError(err, 'فشل تحميل المخازن'));
        this.loading.set(false);
      },
    });
  }

  async remove(s: Store) {
    const ok = await this.confirm.confirm({
      title: 'حذف مخزن',
      message: `هل أنت متأكد من حذف المخزن "${s.name}"؟ لا يمكن التراجع عن هذا الإجراء.`,
      confirmText: 'حذف',
      danger: true,
    });
    if (!ok) return;

    this.actionError.set(null);
    this.deletingId.set(s.id);
    this.service.delete(s.id).subscribe({
      next: () => {
        this.stores.update(list => list.filter(x => x.id !== s.id));
        this.deletingId.set(null);
      },
      error: err => {
        this.actionError.set(apiError(err, 'فشل حذف المخزن'));
        this.deletingId.set(null);
      },
    });
  }
}