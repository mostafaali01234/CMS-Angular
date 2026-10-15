// order-line-list/order-line-list.ts
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { OrderLineService } from '../order-line.service';
import { OrderLine } from '../order-line.model';
import { ConfirmService } from '../../../shared/services/confirm.service';
import { apiError } from '../../../shared/utils/api';

@Component({
  selector: 'app-order-line-list',
  imports: [RouterLink, FormsModule],
  templateUrl: './order-line-list.html',
})
export class OrderLineList implements OnInit {
  private service = inject(OrderLineService);
  private confirm = inject(ConfirmService);

  lines = signal<OrderLine[]>([]);
  search = signal('');
  loading = signal(true);
  error = signal<string | null>(null);
  actionError = signal<string | null>(null);
  deletingId = signal<number | null>(null);

  filtered = computed(() => {
    const q = this.search().trim().toLowerCase();
    if (!q) return this.lines();
    return this.lines().filter(l =>
      l.name.toLowerCase().includes(q) ||
      (l.notes ?? '').toLowerCase().includes(q) ||
      (l.manager?.name ?? '').toLowerCase().includes(q)
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
        this.lines.set(data);
        this.loading.set(false);
      },
      error: err => {
        this.error.set(apiError(err, 'فشل تحميل خطوط الطلبات'));
        this.loading.set(false);
      },
    });
  }

  names(items?: { name: string }[]): string {
    return items?.map(i => i.name).join('، ') ?? '';
  }

  async remove(l: OrderLine) {
    const ok = await this.confirm.confirm({
      title: 'حذف خط طلب',
      message: `هل أنت متأكد من حذف خط الطلب "${l.name}"؟ لا يمكن التراجع عن هذا الإجراء.`,
      confirmText: 'حذف',
      danger: true,
    });
    if (!ok) return;

    this.actionError.set(null);
    this.deletingId.set(l.id);
    this.service.delete(l.id).subscribe({
      next: () => {
        this.lines.update(list => list.filter(x => x.id !== l.id));
        this.deletingId.set(null);
      },
      error: err => {
        this.actionError.set(apiError(err, 'فشل حذف خط الطلب'));
        this.deletingId.set(null);
      },
    });
  }
}