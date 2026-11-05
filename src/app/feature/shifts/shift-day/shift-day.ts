// shift-day/shift-day.ts
import { Component, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { ShiftService } from '../shift.service';
import { Shift, ShiftTech, shiftTotals, TECH_TYPES, techBody, techLabel, TechRow, toRows, validateTechs } from '../shift.model';
import { LookupService } from '../../../shared/services/lookup.service';
import { ConfirmService } from '../../../shared/services/confirm.service';
import { today } from '../../../shared/utils/date';
import { apiError } from '../../../shared/utils/api';
import { TechsEditor } from '../techs-editor/techs-editor';
import { StoreOption } from '../../../shared/models/lookup.model';


interface Option { id: number; name: string; }
// interface Slot { id: number; tech_id: number; tech_type: number; }
interface Draft { country_state_id: number; store_id: number; km_start: number; km_end: number; techs: TechRow[]; }
interface Row {
  car: Option; shift: Shift | null; draft: Draft | null;
  saving: boolean; error: string | null;
}

// const SLOTS = 3;
const emptyDraft = (): Draft => ({
  country_state_id: 0, store_id: 0, km_start: 0, km_end: 0, techs: [{ id: 0, tech_id: 0, tech_type: 'Tech' }],
});


@Component({
  selector: 'app-shift-day',
  imports: [ RouterLink, FormsModule, DecimalPipe, TechsEditor],
  templateUrl: './shift-day.html',
})
export class ShiftDay {
  private service = inject(ShiftService);
  private confirm = inject(ConfirmService);
  lookup = inject(LookupService);

  // techTypes = TECH_TYPES;
  totals = shiftTotals;
  // slotIndexes = Array.from({ length: SLOTS }, (_, i) => i);

  date = signal(today());
  rows = signal<Row[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);

  states = signal<Option[]>([]);
  stores = signal<StoreOption[]>([]);
  employees = signal<Option[]>([]);
  private cars: Option[] = [];
  techLabel = techLabel;


  constructor() {
    forkJoin({
      cars: this.lookup.cars(), states: this.lookup.states(),
      stores: this.lookup.stores(), employees: this.lookup.employees(),
    }).subscribe({
      next: r => {
        this.cars = r.cars; this.states.set(r.states); this.stores.set(r.stores); this.employees.set(r.employees);
        this.load();
      },
      error: err => this.error.set(apiError(err, 'فشل تحميل القوائم')),
    });
  }

  shiftDate(days: number) {
    const d = new Date(this.date()); d.setDate(d.getDate() + days);
    this.date.set(d.toISOString().slice(0, 10));
    this.load();
  }

  load() {
    this.loading.set(true); this.error.set(null);
    this.service.getByDate(this.date()).subscribe({
      next: shifts => {
        const byCar = new Map(shifts.map(s => [s.car_id, s]));
        this.rows.set(this.cars.map(c => ({
          car: c, shift: byCar.get(c.id) ?? null, draft: null, saving: false, error: null,
        })));
        this.loading.set(false);
      },
      error: err => { this.error.set(apiError(err, 'فشل تحميل الورديات')); this.loading.set(false); },
    });
  }

  private patch(car: Option, change: Partial<Row>) {
    this.rows.update(rs => rs.map(r => (r.car.id === car.id ? { ...r, ...change } : r)));
  }

 startEdit(r: Row) {
    const s = r.shift;
    if (!s) { this.patch(r.car, { draft: emptyDraft(), error: null }); return; }
    this.patch(r.car, { error: null, draft: {
      country_state_id: s.country_state_id, store_id: s.store_id, km_start: s.km_start, km_end: s.km_end,
      techs: toRows(s.techs),
    } });
  }

  cancel(r: Row) { this.patch(r.car, { draft: null, error: null }); }

  save(r: Row) {
  const d = r.draft!;
  const techErr = validateTechs(d.techs);
  if (!d.country_state_id) return this.patch(r.car, { error: 'اختر الجهة' });
  if (!d.store_id) return this.patch(r.car, { error: 'اختر المخزن' });
  if (techErr) return this.patch(r.car, { error: techErr });
  if (d.km_end < d.km_start) return this.patch(r.car, { error: 'النهاية اقل من البداية' });

  const body = {
    ...(r.shift ?? { notes: '', project_id: null }),
    id: r.shift?.id ?? 0, date: this.date(), car_id: r.car.id,
    country_state_id: d.country_state_id, store_id: d.store_id,
    km_start: d.km_start, km_end: d.km_end, techs: techBody(d.techs, this.date()),
  };
    this.patch(r.car, { saving: true, error: null });
    const done = () => { this.patch(r.car, { saving: false, draft: null }); this.load(); };
    const fail = (err: unknown) => this.patch(r.car, { saving: false, error: apiError(err, 'فشل الحفظ') });

    if (r.shift) this.service.update(r.shift.id, body as any).subscribe({ next: done, error: fail });
    else this.service.create(body as any).subscribe({ next: done, error: fail });
  }

  async remove(r: Row) {
    if (!r.shift) return;
    const ok = await this.confirm.confirm({
      title: 'حذف وردية', message: `هل أنت متأكد من حذف وردية "${r.car.name}"؟`, confirmText: 'حذف', danger: true,
    });
    if (!ok) return;
    this.service.delete(r.shift.id).subscribe({
      next: () => this.load(),
      error: err => this.patch(r.car, { error: apiError(err, 'فشل الحذف') }),
    });
  }
}