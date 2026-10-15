// product-category-list/product-category-list.ts
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ProductCategoryService } from '../product-category.service';
import { ProductCategory } from '../product-category.model';
import { ConfirmService } from '../../../shared/services/confirm.service';
import { apiError } from '../../../shared/utils/api';

@Component({
  selector: 'app-product-category-list',
  imports: [RouterLink, FormsModule],
  templateUrl: './product-category-list.html',
})
export class ProductCategoryList implements OnInit {
  private service = inject(ProductCategoryService);
  private confirm = inject(ConfirmService);

  categories = signal<ProductCategory[]>([]);
  search = signal('');
  loading = signal(true);
  error = signal<string | null>(null);        // loading failed: replaces the table
  actionError = signal<string | null>(null);  // delete failed: shown above the table
  deletingId = signal<number | null>(null);

  filtered = computed(() => {
    const q = this.search().trim().toLowerCase();
    if (!q) return this.categories();
    return this.categories().filter(c =>
      c.name.toLowerCase().includes(q) ||
      (c.description ?? '').toLowerCase().includes(q)
    );
  });

  ngOnInit() {
    this.load();
  }

  load() {
    this.loading.set(true);
    this.error.set(null);
    this.service.getAll().subscribe({
      next: data => {
        this.categories.set(data);
        this.loading.set(false);
      },
      error: err => {
        this.error.set(apiError(err, 'فشل تحميل التصنيفات'));
        this.loading.set(false);
      },
    });
  }

  async remove(c: ProductCategory) {
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