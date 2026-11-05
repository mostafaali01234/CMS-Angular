// shift-board/shift-board.ts
import { Component, computed, inject, signal, WritableSignal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { forkJoin, Observable } from 'rxjs';
import { ShiftService } from '../shift.service';
import { custodyTx, paidOf, settlementTx, ShiftBoard, shiftTotals, techBody, techLabel, TechRow, toRows, validateTechs } from '../shift.model';
import { TechsEditor } from '../techs-editor/techs-editor';
import { LookupService } from '../../../shared/services/lookup.service';
import { AuthService } from '../../../core/services/AuthService/auth';
import { today } from '../../../shared/utils/date';
import { apiError } from '../../../shared/utils/api';
import { ConfirmService } from '../../../shared/services/confirm.service';
import { InvoiceItems } from '../invoice-items/invoice-items';
import { InvItem, lineNet, lineTotal, toBodyItems, toInvItem, validateItems } from '../shift.model';


interface Option { id: number; name: string; }
interface StoreOption extends Option { manager_name?: string; }
const newTechs = (): TechRow[] => [{ id: 0, tech_id: 0, tech_type: 'Tech' }];

@Component({
  selector: 'app-shift-board',
  imports: [RouterLink, FormsModule, DecimalPipe, TechsEditor, InvoiceItems],
  templateUrl: './shift-board.html',
})
export class ShiftBoardPage {
  private service = inject(ShiftService);
  private auth = inject(AuthService);
  private qp = inject(ActivatedRoute).snapshot.queryParamMap;
  lookup = inject(LookupService);
  private confirm = inject(ConfirmService);


  totals = shiftTotals;
  paidOf = paidOf;
  techLabel = techLabel;
  custodyTx = custodyTx;
  settlementTx = settlementTx;

  moneySafes = signal<Option[]>([]);
  otherSafes = computed(() => this.moneySafes().filter(m => m.id !== this.board()?.money_safe_id));
  safeName = (id: number) => this.moneySafes().find(m => m.id === id)?.name ?? '';
  custodyError = signal<string | null>(null);
  settleError = signal<string | null>(null);
  custody = signal({ money_safe_id: 0, amount: 0, notes: '' });
  settle = signal({ money_safe_id: 0, notes: '' });
  settleAmount = signal<number | null>(null);       // null: the shift net is used

  date = signal(this.qp.get('date') || today());
  storeId = signal(Number(this.qp.get('store')) || 0);

  board = signal<ShiftBoard | null>(null);
  loading = signal(false);
  saving = signal(false);
  busy = signal(false);                       // an add action is running
  error = signal<string | null>(null);

  cars = signal<Option[]>([]);
  states = signal<Option[]>([]);
  stores = signal<StoreOption[]>([]);
  employees = signal<Option[]>([]);
  expenseTypes = signal<Option[]>([]);

  form = signal({ car_id: 0, country_state_id: 0, km_start: 0, km_end: 0, notes: '', project_id: null as number | null });
  techs = signal<TechRow[]>(newTechs());
  editing = signal(false);

  // add-action forms
  exp = signal({ expense_type_id: 0, amount: 0, notes: '' });
  loan = signal({ employee_id: 0, amount: 0, notes: '' });
  orderId = signal(0);
  draft = signal<any | null>(null);
  paid = signal(0);
  orderSearch = signal('');

  shift = computed(() => this.board()?.shift ?? null);
  invoices = computed(() => this.shift()?.invoices ?? []);
  safeReady = computed(() => !!this.board()?.money_safe_id);

  // one error per section, shown above its own table
  expError = signal<string | null>(null);
  loanError = signal<string | null>(null);
  invoiceError = signal<string | null>(null);

  draftRows = signal<InvItem[]>([]);
  draftTotal = computed(() => {
    const d = this.draft();
    if (!d) return 0;
    return Math.max(0, this.draftRows().reduce((a, i) => a + lineNet(i), 0) - (d.discount ?? 0));
  });
  editInv = signal<any | null>(null);
  editRows = signal<InvItem[]>([]);
  editTotal = computed(() => {
    const inv = this.editInv();
    if (!inv) return 0;
    return Math.max(0, this.editRows().reduce((a, i) => a + lineNet(i), 0) - (inv.discount ?? 0));
  });

  // open orders that match what was typed: by order number or by customer name, exact number first
  matches = computed(() => {
    const q = this.orderSearch().trim().toLowerCase();
    if (!q) return [];
    const all = this.board()?.open_orders ?? [];
    return all
      .filter(o => String(o.id).includes(q) || o.customer_name.toLowerCase().includes(q))
      .sort((a, b) => Number(String(b.id) === q) - Number(String(a.id) === q) || a.id - b.id)
      .slice(0, 8);
  });

  selectedOrder = computed(() => (this.board()?.open_orders ?? []).find(o => o.id === this.orderId()) ?? null);

  
  shiftDate(days: number) {
    const d = new Date(this.date()); d.setDate(d.getDate() + days);
    this.date.set(d.toISOString().slice(0, 10));
  }

  pickOrder(o: { id: number }) {
    this.orderId.set(o.id);
    this.orderSearch.set('');
    this.loadDraft();
  }

  searchOrder() {
    const q = this.orderSearch().trim();
    if (!q) return;
    const list = this.matches();
    const exact = list.find(o => String(o.id) === q) ?? (list.length === 1 ? list[0] : null);
    if (exact) this.pickOrder(exact);
    else this.invoiceError.set(list.length ? 'اختر الطلب من القائمة' : 'لا يوجد طلب قيد التنفيذ بهذا الرقم');
  }

  clearOrder() {
    this.orderId.set(0); this.draft.set(null); this.draftRows.set([]); this.orderSearch.set('');
  }

  ordered(row: { ordered_by_order: Record<string, number> }, orderId: number | null) {
    return orderId == null ? 0 : (row.ordered_by_order[orderId] ?? 0);
  }

  hasOther = computed(() => (this.board()?.items ?? []).some(r => r.other_change !== 0));

  constructor() {
    forkJoin({
      cars: this.lookup.cars(),
      states: this.lookup.states(),
      stores: this.lookup.stores(),
      employees: this.lookup.employees(),
      expenseTypes: this.lookup.expenseTypes(),
      moneySafes: this.lookup.moneySafes(),
    }).subscribe(r => {
      this.cars.set(r.cars);
      this.states.set(r.states);
      this.stores.set(r.stores);
      this.moneySafes.set(r.moneySafes);
      this.employees.set(r.employees);
      this.expenseTypes.set(r.expenseTypes);
      if (this.storeId()) this.search();
    });
  }

  sold(row: { sold_by_invoice: Record<string, number> }, invoiceId: number) { return row.sold_by_invoice[invoiceId] ?? 0; }

  search() {
    if (!this.storeId()) { this.error.set('اختر المخزن'); return; }
    this.loading.set(true); 
    this.error.set(null); 
    this.editing.set(false); 
    this.draft.set(null); 
    this.orderId.set(0);
    this.expError.set(null); 
    this.loanError.set(null); 
    this.invoiceError.set(null);
    this.editInv.set(null);
    this.orderSearch.set('');
    this.service.getBoard(this.storeId(), this.date()).subscribe({
      next: b => {
        this.board.set(b);
        const s = b.shift;
        if (s) {
          this.form.set({
            car_id: s.car_id, 
            country_state_id: s.country_state_id, 
            km_start: s.km_start,
            km_end: s.km_end, 
            notes: s.notes, 
            project_id: s.project_id
          });
          this.techs.set(toRows(s.techs));
          this.custodyError.set(null); this.settleError.set(null); this.settleAmount.set(null);
        } else {
          this.form.set({ car_id: 0, country_state_id: 0, km_start: 0, km_end: 0, notes: '', project_id: null });
          this.techs.set(newTechs());
        }
        this.loading.set(false);
      },
      error: err => { this.error.set(apiError(err, 'فشل البحث')); this.loading.set(false); },
    });
  }

  setForm(k: string, v: unknown) { this.form.update(f => ({ ...f, [k]: v })); }

  save() {
    const f = this.form();
    const techErr = validateTechs(this.techs());
    if (!f.car_id) return this.error.set('اختر السيارة');
    if (!f.country_state_id) return this.error.set('اختر الجهة');
    if (techErr) return this.error.set(techErr);
    if (f.km_end < f.km_start) return this.error.set('النهاية اقل من البداية');

    const existing = this.shift();
    const body = {
      ...(existing ?? {}), id: existing?.id ?? 0, date: this.date(), store_id: this.storeId(),
      ...f, techs: techBody(this.techs(), this.date())
    } as any;

    this.saving.set(true); this.error.set(null);
    const done = () => { this.saving.set(false); this.search(); };
    const fail = (err: unknown) => { this.error.set(apiError(err, 'فشل الحفظ')); this.saving.set(false); };
    if (existing) this.service.update(existing.id, body).subscribe({ next: done, error: fail });
    else this.service.create(body).subscribe({ next: done, error: fail });
  }

  // ---------- add expense / loan / invoice ----------
  private auditorId() { return Number(this.auth.employeeId()) || 0; }

  private run(req: Observable<unknown>, reset: () => void, msg: string, err: WritableSignal<string | null>) {
    this.busy.set(true); err.set(null);
    req.subscribe({
      next: () => { this.busy.set(false); reset(); this.search(); },
      error: e => { err.set(apiError(e, msg)); this.busy.set(false); },
    });
  }

  addExpense() {
    const e = this.exp();
    if (!e.expense_type_id) return this.expError.set('اختر نوع المصروف');
    if (e.amount <= 0) return this.expError.set('ادخل مبلغا اكبر من صفر');
    this.run(this.service.addExpense(this.shift()!.id, { ...e, auditor_id: this.auditorId() }),
      () => this.exp.set({ expense_type_id: 0, amount: 0, notes: '' }), 'فشل اضافة المصروف', this.expError);
  }

  addLoan() {
    const l = this.loan();
    if (!l.employee_id) return this.loanError.set('اختر الموظف');
    if (l.amount <= 0) return this.loanError.set('ادخل مبلغا اكبر من صفر');
    this.run(this.service.addLoan(this.shift()!.id, { ...l, approved_by_id: this.auditorId(), installment_count: 1 }),
      () => this.loan.set({ employee_id: 0, amount: 0, notes: '' }), 'فشل اضافة العهدة', this.loanError);
  }

  loadDraft() {
    if (!this.orderId()) return;
    this.busy.set(true); this.invoiceError.set(null);
    this.service.invoiceDraft(this.orderId()).subscribe({
      next: d => {
        const src = d.items?.length ? d.items : (d.order_items ?? []);
        this.draftRows.set(src.map((x: any) => toInvItem(x, false)));
        this.draft.set(d); this.paid.set(0); this.busy.set(false);
      },
      error: err => { this.invoiceError.set(apiError(err, 'فشل تحميل الطلب')); this.busy.set(false); },
    });
  }

  addInvoice() {
    const d = this.draft();
    if (!d) return;
    const bad = validateItems(this.draftRows());
    if (bad) return this.invoiceError.set(bad);
    const total = this.draftTotal();
    if (this.paid() < 0 || this.paid() > total) return this.invoiceError.set('المبلغ المدفوع غير صحيح');

    const items = toBodyItems(this.draftRows(), this.shift()!.store_id);
    const payment = this.paid() > 0 ? [{ amount: this.paid(), amount_currency: 0, notes: '', auditor_id: this.auditorId() }] : [];
    this.run(
      this.service.addInvoice(this.shift()!.id, {
        ...d, items, total: items.reduce((a, i) => a + i.product_total, 0), net_total: total,
        order_id: this.orderId(), auditor_id: this.auditorId(), payment,
      }),
      () => { this.draft.set(null); this.draftRows.set([]); this.orderId.set(0); }, 'فشل اضافة الفاتورة', this.invoiceError);
  }

  startEditInvoice(i: { id: number }) {
    this.busy.set(true); this.invoiceError.set(null);
    this.service.getInvoice(i.id).subscribe({
      next: inv => {
        this.editInv.set(inv);
        this.editRows.set((inv.items ?? []).map((x: any) => toInvItem(x, true)));
        this.busy.set(false);
      },
      error: err => { this.invoiceError.set(apiError(err, 'فشل تحميل الفاتورة')); this.busy.set(false); },
    });
  }

  cancelEditInvoice() { this.editInv.set(null); this.editRows.set([]); }

  saveInvoice() {
    const inv = this.editInv();
    if (!inv) return;
    const bad = validateItems(this.editRows());
    if (bad) return this.invoiceError.set(bad);

    const items = toBodyItems(this.editRows(), this.shift()!.store_id);
    this.run(
      this.service.updateInvoice(inv.id, {
        ...inv, items,
        total: items.reduce((a, i) => a + i.product_total, 0), net_total: this.editTotal(),
      }),
      () => this.cancelEditInvoice(), 'فشل حفظ الفاتورة', this.invoiceError);
  }

  private async ask(title: string, message: string) {
    return this.confirm.confirm({ title, message, confirmText: 'حذف', danger: true });
  }

  async removeExpense(e: { id: number; expense_type_name: string; amount: number }) {
    if (!(await this.ask('حذف مصروف', `هل أنت متأكد من حذف مصروف "${e.expense_type_name}" بمبلغ ${e.amount}؟`))) return;
    this.run(this.service.deleteExpense(e.id), () => { }, 'فشل حذف المصروف', this.expError);
  }

  async removeLoan(l: { id: number; employee_name: string; amount: number }) {
    if (!(await this.ask('حذف عهدة', `هل أنت متأكد من حذف عهدة "${l.employee_name}" بمبلغ ${l.amount}؟`))) return;
    this.run(this.service.deleteLoan(l.id), () => { }, 'فشل حذف العهدة', this.loanError);
  }

  async removeInvoice(i: { id: number; number: number }) {
    if (!(await this.ask('حذف فاتورة', `هل أنت متأكد من حذف الفاتورة #${i.number}؟`))) return;
    this.run(this.service.deleteInvoice(i.id), () => { }, 'فشل حذف الفاتورة', this.invoiceError);
  }

  addCustody() {
    const c = this.custody();
    if (!c.money_safe_id) return this.custodyError.set('اختر الخزنة');
    if (c.amount <= 0) return this.custodyError.set('ادخل مبلغا اكبر من صفر');
    this.run(this.service.addCustody(this.shift()!.id, { ...c, auditor_id: this.auditorId() }),
      () => this.custody.set({ money_safe_id: 0, amount: 0, notes: '' }), 'فشل اضافة العهدة', this.custodyError);
  }

  addSettlement() {
    const s = this.settle();
    const amount = this.settleAmount() ?? this.totals(this.shift()!).net;
    if (!s.money_safe_id) return this.settleError.set('اختر الخزنة');
    if (amount <= 0) return this.settleError.set('ادخل مبلغا اكبر من صفر');
    this.run(this.service.addSettlement(this.shift()!.id, { money_safe_id: s.money_safe_id, amount, notes: s.notes, auditor_id: this.auditorId() }),
      () => { this.settle.set({ money_safe_id: 0, notes: '' }); this.settleAmount.set(null); }, 'فشل اضافة التسليم', this.settleError);
  }

  async removeTransaction(t: { id: number; transaction_amount: number }, err: WritableSignal<string | null>) {
    if (!(await this.ask('حذف حركة خزنة', `هل أنت متأكد من حذف الحركة بمبلغ ${t.transaction_amount}؟`))) return;
    this.run(this.service.deleteTransaction(this.shift()!.id, t.id), () => { }, 'فشل حذف الحركة', err);
  }
}