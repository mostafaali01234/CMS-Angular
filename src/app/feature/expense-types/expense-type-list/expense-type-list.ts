// expense-type-list/expense-type-list.ts
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ExpenseTypeService } from '../expense-type.service';
import { ExpenseType } from '../expense-type.model';
import { ConfirmService } from '../../../shared/services/confirm.service';
import { apiError } from '../../../shared/utils/api';

@Component({
  selector: 'app-expense-type-list',
  imports: [RouterLink, FormsModule],
  templateUrl: './expense-type-list.html',
})
export class ExpenseTypeList implements OnInit {
  private service = inject(ExpenseTypeService);
  private confirm = inject(ConfirmService);

  types = signal<ExpenseType[]>([]);
  search = signal('');
  loading = signal(true);
  error = signal<string | null>(null);        // loading failed: replaces the table
  actionError = signal<string | null>(null);  // delete failed: shown above the table
  deletingId = signal<number | null>(null);

  filtered = computed(() => {
    const q = this.search().trim().toLowerCase();
    if (!q) return this.types();
    return this.types().filter(c =>
      c.name.toLowerCase().includes(q)
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
        this.types.set(data);
        this.loading.set(false);
      },
      error: err => {
        this.error.set(apiError(err, 'فشل تحميل الانواع'));
        this.loading.set(false);
      },
    });
  }

  async remove(c: ExpenseType) {
    const ok = await this.confirm.confirm({
      title: 'حذف نوع مصروف',
      message: `هل أنت متأكد من حذف النوع "${c.name}"؟ لا يمكن التراجع عن هذا الإجراء.`,
      confirmText: 'حذف',
      danger: true,
    });
    if (!ok) return;

    this.actionError.set(null);
    this.deletingId.set(c.id);
    this.service.delete(c.id).subscribe({
      next: () => {
        this.types.update(list => list.filter(x => x.id !== c.id));
        this.deletingId.set(null);
      },
      error: err => {
        this.actionError.set(apiError(err, 'فشل حذف النوع'));
        this.deletingId.set(null);
      },
    });
  }
}