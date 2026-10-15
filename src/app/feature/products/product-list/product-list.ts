// product-list/product-list.ts
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ProductService } from '../product.service';
import { Product, PRODUCT_TYPES, STORAGE_TYPES } from '../product.model';
import { ConfirmService } from '../../../shared/services/confirm.service';
import { apiError } from '../../../shared/utils/api';

@Component({
  selector: 'app-product-list',
  imports: [RouterLink, FormsModule, DecimalPipe],
  templateUrl: './product-list.html',
})
export class ProductList implements OnInit {
  private service = inject(ProductService);
  private confirm = inject(ConfirmService);

  products = signal<Product[]>([]);
  search = signal('');
  loading = signal(true);
  error = signal<string | null>(null);
  actionError = signal<string | null>(null);
  deletingId = signal<number | null>(null);

  filtered = computed(() => {
    const q = this.search().trim().toLowerCase();
    if (!q) return this.products();
    return this.products().filter(p =>
      p.name.toLowerCase().includes(q) ||
      (p.barcode ?? '').toLowerCase().includes(q) ||
      (p.category_name ?? '').toLowerCase().includes(q)
    );
  });

  ngOnInit() { this.load(); }

  load() {
    this.loading.set(true);
    this.error.set(null);
    this.service.getAll().subscribe({
      next: data => { this.products.set(data); this.loading.set(false); console.log(data); },
      error: err => {
        this.error.set(apiError(err, 'فشل تحميل المنتجات'));
        this.loading.set(false);
      },
    });
  }

  async remove(p: Product) {
    const ok = await this.confirm.confirm({
      title: 'حذف منتج',
      message: `هل أنت متأكد من حذف المنتج "${p.name}"؟ لا يمكن التراجع عن هذا الإجراء.`,
      confirmText: 'حذف',
      danger: true,
    });
    if (!ok) return;

    this.actionError.set(null);
    this.deletingId.set(p.id);
    this.service.delete(p.id).subscribe({
      next: () => {
        this.products.update(list => list.filter(x => x.id !== p.id));
        this.deletingId.set(null);
      },
      error: err => {
        this.actionError.set(apiError(err, 'فشل حذف المنتج'));
        this.deletingId.set(null);
      },
    });
  }
}