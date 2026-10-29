// car-list/car-list.ts
import { Component, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CarService } from '../car.service';
import { Car, CarFilter, daysLeft, EXPIRY_FILTERS, EXPIRY_WARNING_DAYS } from '../car.model';
import { ConfirmService } from '../../../shared/services/confirm.service';
import { LookupService } from '../../../shared/services/lookup.service';
import { LookupSelect } from '../../../shared/components/lookup-select/lookup-select';
import { Pager } from '../../../shared/components/pager/pager';
import { pagedList } from '../../../shared/utils/paged-list';
import { apiError } from '../../../shared/utils/api';

@Component({
  selector: 'app-car-list',
  imports: [RouterLink, FormsModule, DatePipe, LookupSelect, Pager],
  templateUrl: './car-list.html',
})
export class CarList {
  private service = inject(CarService);
  private confirm = inject(ConfirmService);
  lookup = inject(LookupService);

  expiryFilters = EXPIRY_FILTERS;

  list = pagedList<Car, CarFilter>(
    q => this.service.getPaged(q),
    () => ({ search: '', driverId: 0, expiry: '' }),
    20,
    'فشل تحميل السيارات',
  );

  actionError = signal<string | null>(null);
  deletingId = signal<number | null>(null);

  constructor() { this.list.reload(); }

  /** colour and text of a license or insurance end date */
  expiry(date: string) {
    const n = daysLeft(date);
    if (n < 0) return { color: 'crimson', text: `منتهية منذ ${-n} يوم` };
    if (n <= EXPIRY_WARNING_DAYS) return { color: '#b26a00', text: n === 0 ? 'تنتهي اليوم' : `تنتهي خلال ${n} يوم` };
    return { color: 'inherit', text: '' };
  }

  async remove(c: Car) {
    const ok = await this.confirm.confirm({
      title: 'حذف سيارة',
      message: `هل أنت متأكد من حذف السيارة "${c.name}"؟ لا يمكن التراجع عن هذا الإجراء.`,
      confirmText: 'حذف',
      danger: true,
    });
    if (!ok) return;

    this.actionError.set(null);
    this.deletingId.set(c.id);
    this.service.delete(c.id).subscribe({
      next: () => { this.deletingId.set(null); this.list.reload(); },
      error: err => { this.actionError.set(apiError(err, 'فشل حذف السيارة')); this.deletingId.set(null); },
    });
  }
}