// customer-list/customer-list.ts
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CustomerService } from '../customer.service';
import { Customer } from '../customer.model';
import { DecimalPipe } from '@angular/common';
import { apiError } from '../../../shared/utils/api';
import { ConfirmService } from '../../../shared/services/confirm.service';


@Component({
  selector: 'app-customer-list',
  imports: [RouterLink, FormsModule, DecimalPipe],
  templateUrl: './customer-list.html',
})
export class CustomerList implements OnInit {
  private service = inject(CustomerService);

  customers = signal<Customer[]>([]);
  search = signal('');
  loading = signal(true);
  error = signal<string | null>(null);

  private confirm = inject(ConfirmService);
  deletingId = signal<number | null>(null);

  filtered = computed(() => {
    const q = this.search().trim().toLowerCase();
    if (!q) return this.customers();
    return this.customers().filter(c =>
      c.name.toLowerCase().includes(q) ||
      c.phone.includes(q) ||
      c.phone_2?.includes(q) ||
      c.phone_3?.includes(q) ||
      (c.city_name ?? '').toLowerCase().includes(q)
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
        this.customers.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.error.set(apiError(this.error, 'فشل حذف العميل'));
        this.loading.set(false);
      },
    });
  }

  async remove(c: Customer) {
    const ok = await this.confirm.confirm({
    title: 'حذف عميل',
    message: `هل أنت متأكد من حذف العميل "${c.name}"؟ لا يمكن التراجع عن هذا الإجراء.`,
    confirmText: 'حذف',
    danger: true,
  });
  if (!ok) return;

  this.deletingId.set(c.id);
  this.service.delete(c.id).subscribe({
    next: () => {
      this.customers.update(list => list.filter(x => x.id !== c.id));
      this.deletingId.set(null);
    },
    error: err => {
      this.error.set(apiError(err, 'فشل حذف العميل'));
      this.deletingId.set(null);
    },
  });
  }
}