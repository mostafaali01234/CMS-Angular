// money-safe-category-list/money-safe-category-list.ts
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MoneySafeCategoryService } from '../money-safe-category.service';
import { MoneySafeCategory } from '../money-safe-category.model';
import { ConfirmService } from '../../../shared/services/confirm.service';
import { apiError } from '../../../shared/utils/api';

@Component({
  selector: 'app-money-safe-category-list',
  imports: [RouterLink, FormsModule],
  templateUrl: './money-safe-category-list.html',
})
export class MoneySafeCategoryList implements OnInit {
  private service = inject(MoneySafeCategoryService);
  private confirm = inject(ConfirmService);

  categories = signal<MoneySafeCategory[]>([]);
  search = signal('');
  loading = signal(true);
  error = signal<string | null>(null);
  actionError = signal<string | null>(null);
  deletingId = signal<number | null>(null);

  filtered = computed(() => {
    const q = this.search().trim().toLowerCase();
    const list = [...this.categories()].sort((a, b) => a.orderNumber - b.orderNumber);
    if (!q) return list;
    return list.filter(c =>
      c.name.toLowerCase().includes(q) ||
      (c.notes ?? '').toLowerCase().includes(q));
  });

  ngOnInit() { this.load(); }

  load() {
    this.loading.set(true);
    this.error.set(null);
    this.service.getAll().subscribe({
      next: data => { this.categories.set(data); this.loading.set(false); },
      error: err => {
        this.error.set(apiError(err, 'فشل تحميل التصنيفات'));
        this.loading.set(false);
      },
    });
  }

  async remove(c: MoneySafeCategory) {
    const ok = await this.confirm.confirm({
      title: 'حذف تصنيف',
      message: `هل أنت متأكد من حذف التصنيف "${c.name}"؟ لا يمكن التراجع عن هذا الإجراء.`,
      confirmText: 'حذف',
      danger: true,
    });
    if (!ok) return;

    this.actionError.set(null);
    this.deletingId.set(c.id);
    this.service.delete(c.id).subscribe({
      next: () => {
        this.categories.update(list => list.filter(x => x.id !== c.id));
        this.deletingId.set(null);
      },
      error: err => {
        this.actionError.set(apiError(err, 'فشل حذف التصنيف'));
        this.deletingId.set(null);
      },
    });
  }
}