// sales-manager-list/sales-manager-list.ts
import { Component, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { SalesManagerService } from '../sales-manager.service';
import { SalesManagerGroup } from '../sales-manager.model';
import { ConfirmService } from '../../../shared/services/confirm.service';
import { apiError } from '../../../shared/utils/api';

@Component({
  selector: 'app-sales-manager-list',
  imports: [RouterLink, DecimalPipe],
  templateUrl: './sales-manager-list.html',
})
export class SalesManagerList {
  private service = inject(SalesManagerService);
  private confirm = inject(ConfirmService);

  groups = signal<SalesManagerGroup[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);
  actionError = signal<string | null>(null);
  deletingId = signal<number | null>(null);

  constructor() { this.load(); }

  load() {
    this.loading.set(true); this.error.set(null);
    this.service.getAll().subscribe({
      next: g => { this.groups.set(g); this.loading.set(false); },
      error: err => { this.error.set(apiError(err, 'فشل تحميل المجموعات')); this.loading.set(false); },
    });
  }

  async remove(g: SalesManagerGroup) {
    const ok = await this.confirm.confirm({
      title: 'حذف مجموعة', confirmText: 'حذف', danger: true,
      message: `هل أنت متأكد من حذف مجموعة "${g.manager_name}"؟ العمولات المحسوبة سابقا لا تتأثر.`,
    });
    if (!ok) return;
    this.actionError.set(null); this.deletingId.set(g.id);
    this.service.delete(g.id).subscribe({
      next: () => { this.deletingId.set(null); this.load(); },
      error: err => { this.actionError.set(apiError(err, 'فشل الحذف')); this.deletingId.set(null); },
    });
  }
}