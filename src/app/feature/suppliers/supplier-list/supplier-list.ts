// supplier-list/supplier-list.ts
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { SupplierService } from '../supplier.service';
import { Supplier } from '../supplier.model';
import { ConfirmService } from '../../../shared/services/confirm.service';
import { apiError } from '../../../shared/utils/api';

@Component({
  selector: 'app-supplier-list',
  imports: [RouterLink, FormsModule, DecimalPipe],
  templateUrl: './supplier-list.html',
})
export class SupplierList implements OnInit {
  private service = inject(SupplierService);
  private confirm = inject(ConfirmService);

  suppliers = signal<Supplier[]>([]);
  search = signal('');
  loading = signal(true);
  error = signal<string | null>(null);
  actionError = signal<string | null>(null);
  deletingId = signal<number | null>(null);

  filtered = computed(() => {
    const q = this.search().trim().toLowerCase();
    if (!q) return this.suppliers();
    return this.suppliers().filter(s =>
      [s.name, s.name_en, s.phone, s.email, s.tax_card, s.commercial_register, s.city?.name, s.address]
        .some(v => (v ?? '').toLowerCase().includes(q)));
  });

  ngOnInit() { this.load(); }

  load() {
    this.loading.set(true);
    this.error.set(null);
    this.service.getAll().subscribe({
      next: data => { this.suppliers.set(data); this.loading.set(false); },
      error: err => {
        this.error.set(apiError(err, 'فشل تحميل الموردين'));
        this.loading.set(false);
      },
    });
  }

  async remove(s: Supplier) {
    const ok = await this.confirm.confirm({
      title: 'حذف مورد',
      message: `هل أنت متأكد من حذف المورد "${s.name}"؟ لا يمكن التراجع عن هذا الإجراء.`,
      confirmText: 'حذف',
      danger: true,
    });
    if (!ok) return;

    this.actionError.set(null);
    this.deletingId.set(s.id);
    this.service.delete(s.id).subscribe({
      next: () => {
        this.suppliers.update(list => list.filter(x => x.id !== s.id));
        this.deletingId.set(null);
      },
      error: err => {
        this.actionError.set(apiError(err, 'فشل حذف المورد'));
        this.deletingId.set(null);
      },
    });
  }
}