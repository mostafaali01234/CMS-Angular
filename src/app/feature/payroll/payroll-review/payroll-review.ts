// payroll-review/payroll-review.ts
import { Component, computed, inject, signal } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { PayrollService } from '../payroll.service';
import {
  Adjustment, AdjKind, adjLabel, KIND_LABELS, PayrollPreview, ROLE_LABELS, statusLabel, typesFor,
} from '../payroll.model';
import { LookupService } from '../../../shared/services/lookup.service';
import { ConfirmService } from '../../../shared/services/confirm.service';
import { AuthService } from '../../../core/services/AuthService/auth'; 
import { exportFile } from '../../../shared/utils/download';
import { today } from '../../../shared/utils/date';
import { apiError } from '../../../shared/utils/api';

@Component({
  selector: 'app-payroll-review',
  imports: [RouterLink, FormsModule, DecimalPipe, DatePipe],
  templateUrl: './payroll-review.html',
})
export class PayrollReview {
  private service = inject(PayrollService);
  private confirm = inject(ConfirmService);
  private auth = inject(AuthService);
  lookup = inject(LookupService);

  roleLabel = ROLE_LABELS;
  statusLabel = statusLabel;
  kindLabel = KIND_LABELS;
  adjLabel = adjLabel;
  typesFor = typesFor;

  // ASSUMPTION: AuthService exposes isAdmin() (Admin or SuperAdmin) and employeeId(). Rename to yours.
  isAdmin = computed(() => !!this.auth.isAdmin());

  employees = signal<{ id: number; name: string }[]>([]);
  period = signal(today().slice(0, 7));          // yyyy-MM
  employeeId = signal(0);

  p = signal<PayrollPreview | null>(null);
  loading = signal(false);
  busy = signal(false);
  error = signal<string | null>(null);
  commError = signal<string | null>(null);
  adjError = signal<string | null>(null);
  recalcMessage = signal<string | null>(null);

  exporting = signal(false);
  exportError = signal<string | null>(null);

  // the "اضافي" input of every commission row, by commission id
  extras = signal<Record<number, number>>({});

  // the add form of additions / deductions
  adj = signal({
    kind: 'Deduction' as AdjKind,
    type: 'Absence',
    operation_date: today(),
    amount: 0,
    reason: '',
  });

  // an approved payroll exists for this month
  locked = computed(() => !!this.p()?.existing_payroll);

  // inspecting only: employees always, admins once the payroll is approved
  readOnly = computed(() => !this.isAdmin() || this.locked());

  setExtraValue(id: number, value: number | string) {
    this.extras.update(m => ({ ...m, [id]: +value }));
  }

  constructor() {
    if (this.isAdmin()) {
      this.lookup.employees().subscribe(e => this.employees.set(e));
    } else {
      // an employee sees only his own payroll, and the lookups are admin-only anyway
      this.employeeId.set(Number(this.auth.employeeId()) || 0);
      this.calc();
    }
  }

  private auditorId() { return Number(this.auth.employeeId()) || 0; }

  private ym() {
    const [y, m] = this.period().split('-').map(Number);
    return { year: y, month: m };
  }

  onPeriod(v: string) {
    this.period.set(v);
    if (!this.isAdmin() && v) this.calc();      // an employee has nothing else to choose
  }

  /** the "حساب المرتب" button */
  search() {
    this.recalcMessage.set(null);
    this.calc();
  }

  calc() {
    if (!this.employeeId()) { this.error.set('اختر الموظف'); return; }
    if (!this.period()) { this.error.set('اختر الشهر'); return; }

    const { year, month } = this.ym();
    this.loading.set(true);
    this.error.set(null); this.commError.set(null); this.adjError.set(null); this.exportError.set(null);

    this.service.preview(this.employeeId(), month, year).subscribe({
      next: p => {
        this.p.set(p);
        this.extras.set(Object.fromEntries(p.commissions.map(c => [c.id, c.extra_amount])));
        this.loading.set(false);
      },
      error: err => { this.error.set(apiError(err, 'فشل حساب المرتب')); this.loading.set(false); },
    });
  }

  // ---------- excel ----------
  exportExcel() {
    const p = this.p();
    if (!p) return;
    const mm = String(p.month).padStart(2, '0');
    exportFile(
      this.service.exportReview(p.employee_id, p.month, p.year),
      `payroll-${p.employee_id}-${p.year}-${mm}.xlsx`,
      { busy: this.exporting, error: this.exportError },
    );
  }

  // ---------- commissions ----------
  setExtra(id: number) {
    this.busy.set(true); this.commError.set(null);
    this.service.setExtra(id, this.extras()[id] ?? 0).subscribe({
      next: () => { this.busy.set(false); this.calc(); },
      error: err => { this.commError.set(apiError(err, 'فشل تعديل العمولة')); this.busy.set(false); },
    });
  }

  async recalculate() {
    const p = this.p();
    if (!p || this.locked()) return;

    const ok = await this.confirm.confirm({
      title: 'اعادة حساب العمولات',
      message: `اعادة حساب عمولات "${p.employee_name}" عن ${p.month}/${p.year} من الفواتير؟ العمولات المعتمدة في مرتبات سابقة لا تتغير.`,
      confirmText: 'اعادة الحساب',
    });
    if (!ok) return;

    this.busy.set(true); this.commError.set(null); this.recalcMessage.set(null);
    this.service.recalculate(p.employee_id, p.month, p.year).subscribe({
      next: r => {
        this.busy.set(false);
        this.recalcMessage.set(
          `تمت اعادة حساب ${r.shifts} وردية و ${r.invoices} فاتورة بدون وردية` +
          (r.skipped ? ` (تم تخطي ${r.skipped} مغلقة بمرتب معتمد)` : ''));
        this.calc();
      },
      error: err => { this.commError.set(apiError(err, 'فشل اعادة حساب العمولات')); this.busy.set(false); },
    });
  }

  // ---------- additions and deductions ----------
  setKind(k: AdjKind) {
    // the type list depends on the kind, so reset the type to the first one that fits
    this.adj.update(x => ({ ...x, kind: k, type: typesFor(k)[0].value }));
  }

  addAdjustment() {
    const a = this.adj();
    if (a.amount <= 0) { this.adjError.set('ادخل مبلغا اكبر من صفر'); return; }
    if (!a.operation_date) { this.adjError.set('اختر التاريخ'); return; }

    this.busy.set(true); this.adjError.set(null);
    this.service.addAdjustment({ ...a, employee_id: this.employeeId(), approved_by_id: this.auditorId() }).subscribe({
      next: () => {
        this.busy.set(false);
        this.adj.update(x => ({ ...x, amount: 0, reason: '' }));
        this.calc();
      },
      error: err => { this.adjError.set(apiError(err, 'فشل الاضافة')); this.busy.set(false); },
    });
  }

  async removeAdjustment(a: Adjustment) {
    const ok = await this.confirm.confirm({
      title: 'حذف',
      message: `حذف ${adjLabel(a.type)} (${KIND_LABELS[a.kind]}) بقيمة ${a.amount}؟`,
      confirmText: 'حذف',
      danger: true,
    });
    if (!ok) return;

    this.adjError.set(null);
    this.service.deleteAdjustment(a.id).subscribe({
      next: () => this.calc(),
      error: err => this.adjError.set(apiError(err, 'فشل الحذف')),
    });
  }

  // ---------- approve / delete the payroll ----------
  async approve() {
    const p = this.p()!;
    const ok = await this.confirm.confirm({
      title: 'اعتماد المرتب',
      message: `اعتماد مرتب "${p.employee_name}" عن ${p.month}/${p.year} بصافي ${p.net_total}؟ لن يمكن تعديل العمولات المرتبطة بعد الاعتماد.`,
      confirmText: 'اعتماد',
    });
    if (!ok) return;

    this.busy.set(true); this.error.set(null);
    this.service.review({
      employee_id: p.employee_id, month: p.month, year: p.year, revised_by_id: this.auditorId(),
    }).subscribe({
      next: () => { this.busy.set(false); this.calc(); },
      error: err => { this.error.set(apiError(err, 'فشل اعتماد المرتب')); this.busy.set(false); },
    });
  }

  async removePayroll() {
    const ex = this.p()?.existing_payroll;
    if (!ex) return;

    const ok = await this.confirm.confirm({
      title: 'حذف مرتب معتمد',
      message: 'سيتم حذف المرتب وفك ارتباط العمولات والاضافات والخصومات والسلف به. هل أنت متأكد؟',
      confirmText: 'حذف',
      danger: true,
    });
    if (!ok) return;

    this.busy.set(true); this.error.set(null);
    this.service.delete(ex.id).subscribe({
      next: () => { this.busy.set(false); this.calc(); },
      error: err => { this.error.set(apiError(err, 'فشل الحذف')); this.busy.set(false); },
    });
  }
}